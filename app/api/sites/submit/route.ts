import { NextRequest, NextResponse } from "next/server";
import { isPermittedCrawlUrl } from "../../../../lib/safety";

function normalizeSiteUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  url.username = "";
  url.password = "";
  return url.toString();
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { url?: string } | null;
  const submittedUrl = body?.url?.trim();

  if (!submittedUrl || !isPermittedCrawlUrl(submittedUrl)) {
    return NextResponse.json(
      { error: "Enter a public http:// or https:// website address." },
      { status: 400 },
    );
  }

  try {
    // Load Firebase only after validating the request. Public website submission is
    // intentionally anonymous for now, so this route must not load Firebase Auth.
    const [{ FieldValue }, { adminDb }] = await Promise.all([
      import("firebase-admin/firestore"),
      import("../../../../lib/firebase/admin"),
    ]);

    const url = normalizeSiteUrl(submittedUrl);
    const hostname = new URL(url).hostname.toLowerCase();

    const existing = await adminDb
      .collection("siteSubmissions")
      .where("hostname", "==", hostname)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({
        ok: true,
        alreadySubmitted: true,
        message: "That website is already in the MPlace crawl queue or index.",
      });
    }

    const submission = await adminDb.collection("siteSubmissions").add({
      url,
      hostname,
      status: "queued",
      source: "public-submit",
      submitterUid: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await adminDb.collection("crawlJobs").add({
      siteSubmissionId: submission.id,
      url,
      hostname,
      kind: "site-seed",
      status: "queued",
      attempts: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      id: submission.id,
      message: "Website added to the MPlace crawl queue.",
    });
  } catch (error) {
    console.error("MPlace site submission failed", error);
    return NextResponse.json(
      {
        error:
          "MPlace could not save this submission. Check the Firebase Admin environment variables and Firestore setup.",
      },
      { status: 500 },
    );
  }
}
