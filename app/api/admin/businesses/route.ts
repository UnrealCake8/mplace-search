import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getMPlaceUser } from "../../../../lib/auth/session";
import { adminDb } from "../../../../lib/firebase/admin";

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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const snapshot = await adminDb
    .collection("businesses")
    .where("status", "==", "pending-review")
    .limit(100)
    .get();

  const businesses = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || "Untitled business",
      category: data.category || "",
      address: data.address || "",
      city: data.city || "",
      country: data.country || "",
      website: data.website || null,
      phone: data.phone || null,
      description: data.description || null,
      ownerUid: data.ownerUid || null,
      status: data.status || "pending-review",
    };
  });

  return NextResponse.json({ ok: true, businesses });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { id?: string; action?: "approve" | "reject" } | null;
  if (!body?.id || !["approve", "reject"].includes(body.action || "")) {
    return NextResponse.json({ error: "Invalid review request." }, { status: 400 });
  }

  const ref = adminDb.collection("businesses").doc(body.id);
  const existing = await ref.get();
  if (!existing.exists) return NextResponse.json({ error: "Business not found." }, { status: 404 });

  const approved = body.action === "approve";
  await ref.update({
    status: approved ? "approved" : "rejected",
    searchable: approved,
    reviewedAt: FieldValue.serverTimestamp(),
    reviewedBy: admin.uid,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({
    ok: true,
    status: approved ? "approved" : "rejected",
    searchable: approved,
  });
}
