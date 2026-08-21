import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getMPlaceUser } from "../../../../lib/auth/session";
import { adminDb } from "../../../../lib/firebase/admin";
import { assessPageSafety } from "../../../../lib/safety";

function adminEmails() {
  return (process.env.MPLACE_ADMIN_EMAIL || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function requireAdmin() {
  const user = await getMPlaceUser();
  const email = user?.email?.toLowerCase();
  return user && email && adminEmails().includes(email) ? user : null;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function tokenize(value: string) {
  return [...new Set(value.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [])].slice(0, 250);
}

function docIdForUrl(url: string) {
  return Buffer.from(url).toString("base64url").slice(0, 1400);
}

function normalizeUrl(raw: string) {
  const url = new URL(raw.trim());
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS URLs are supported.");
  url.hash = "";
  return url;
}

type ManualIndexBody = {
  url?: string;
  title?: string;
  description?: string;
  keywords?: string[] | string;
  headings?: string;
};

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const snapshot = await adminDb
    .collection("indexedPages")
    .where("source", "==", "manual")
    .limit(50)
    .get();

  const pages = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      url: data.canonicalUrl || data.url || "",
      title: data.title || "Untitled",
      description: data.description || "",
      hostname: data.hostname || "",
      searchable: data.searchable === true,
      safetyDecision: data.safetyDecision || "unknown",
    };
  });

  return NextResponse.json({ ok: true, pages });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as ManualIndexBody | null;
  if (!body?.url || !body?.title || !body?.description) {
    return NextResponse.json({ error: "URL, title, and description are required." }, { status: 400 });
  }

  let url: URL;
  try {
    url = normalizeUrl(body.url);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid URL." }, { status: 400 });
  }

  const title = normalizeText(body.title).slice(0, 300);
  const description = normalizeText(body.description).slice(0, 1000);
  const headings = normalizeText(body.headings || "").slice(0, 4000);
  const keywords = Array.isArray(body.keywords)
    ? body.keywords.map((value) => normalizeText(String(value))).filter(Boolean).slice(0, 50)
    : String(body.keywords || "").split(",").map((value) => normalizeText(value)).filter(Boolean).slice(0, 50);

  if (!title || !description) {
    return NextResponse.json({ error: "Title and description cannot be blank." }, { status: 400 });
  }

  const searchableText = `${title}\n${description}\n${headings}\n${keywords.join(" ")}`;
  const safety = assessPageSafety(searchableText);
  const searchable = safety.decision === "allow";
  const canonicalUrl = url.toString();
  const ref = adminDb.collection("indexedPages").doc(docIdForUrl(canonicalUrl));

  await ref.set({
    url: canonicalUrl,
    canonicalUrl,
    hostname: url.hostname.toLowerCase(),
    title,
    description,
    text: description,
    headings,
    keywords,
    terms: tokenize(`${title} ${description} ${headings} ${keywords.join(" ")} ${url.hostname} ${url.pathname}`),
    safetyDecision: safety.decision,
    safetyCategories: safety.categories,
    searchable,
    source: "manual",
    manuallyIndexedBy: admin.uid,
    manuallyIndexedByEmail: admin.email || null,
    manuallyIndexedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return NextResponse.json({
    ok: true,
    id: ref.id,
    url: canonicalUrl,
    searchable,
    safetyDecision: safety.decision,
  });
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "Page ID is required." }, { status: 400 });

  const ref = adminDb.collection("indexedPages").doc(body.id);
  const snapshot = await ref.get();
  if (!snapshot.exists) return NextResponse.json({ error: "Indexed page not found." }, { status: 404 });
  if (snapshot.data()?.source !== "manual") {
    return NextResponse.json({ error: "Crawler-managed pages cannot be deleted from the manual index tool." }, { status: 409 });
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}
