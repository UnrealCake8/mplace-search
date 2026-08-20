import { NextRequest, NextResponse } from "next/server";
import { processNextCrawlJobs } from "../../../../lib/crawler";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const allowed = [process.env.CRAWLER_SECRET, process.env.CRON_SECRET]
    .filter((value): value is string => Boolean(value));

  if (!allowed.length) return process.env.NODE_ENV !== "production";
  return allowed.some((secret) => auth === `Bearer ${secret}`);
}

async function run(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requested = Number(request.nextUrl.searchParams.get("jobs") || "1");
  const jobs = Number.isFinite(requested) ? Math.max(1, Math.min(Math.floor(requested), 5)) : 1;
  const results = await processNextCrawlJobs(jobs);

  return NextResponse.json({ ok: true, processed: results.length, results });
}

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}
