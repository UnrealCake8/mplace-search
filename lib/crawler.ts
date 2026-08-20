import dns from "node:dns/promises";
import net from "node:net";
import { load } from "cheerio";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase/admin";
import { assessPageSafety, isPermittedCrawlUrl } from "./safety";

const USER_AGENT = "MPlaceSearchBot/0.1 (+https://mplace.cc/safety)";
const MAX_REDIRECTS = 5;
const MAX_BYTES = 2_000_000;
const MAX_PAGES_PER_SITE = 30;
const FETCH_TIMEOUT_MS = 10_000;

function isPrivateIp(address: string) {
  if (net.isIPv4(address)) {
    const p = address.split(".").map(Number);
    return (
      p[0] === 10 ||
      p[0] === 127 ||
      (p[0] === 169 && p[1] === 254) ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168) ||
      p[0] === 0
    );
  }

  if (net.isIPv6(address)) {
    const a = address.toLowerCase();
    return a === "::1" || a === "::" || a.startsWith("fc") || a.startsWith("fd") || a.startsWith("fe80:");
  }

  return true;
}

async function assertPublicHost(url: URL) {
  if (!isPermittedCrawlUrl(url.toString())) throw new Error("URL is not permitted");
  const records = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (!records.length || records.some((record) => isPrivateIp(record.address))) {
    throw new Error("Hostname resolves to a private or unsupported address");
  }
}

async function readLimitedBody(response: Response) {
  const declared = Number(response.headers.get("content-length") || "0");
  if (declared > MAX_BYTES) throw new Error("Response is too large");
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let output = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new Error("Response exceeded size limit");
    }
    output += decoder.decode(value, { stream: true });
  }

  output += decoder.decode();
  return output;
}

async function safeFetch(input: string, accept = "text/html,application/xhtml+xml") {
  let current = new URL(input);

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    await assertPublicHost(current);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": USER_AGENT,
          accept,
        },
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) throw new Error("Redirect without location");
        current = new URL(location, current);
        continue;
      }

      return { response, finalUrl: current, body: await readLimitedBody(response) };
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("Too many redirects");
}

type RobotsRules = {
  allows(pathname: string): boolean;
  sitemaps: string[];
};

function parseRobots(text: string): RobotsRules {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/#.*$/, "").trim()).filter(Boolean);
  const groups: { agents: string[]; rules: { type: "allow" | "disallow"; path: string }[] }[] = [];
  const sitemaps: string[] = [];
  let current: { agents: string[]; rules: { type: "allow" | "disallow"; path: string }[] } | null = null;

  for (const line of lines) {
    const split = line.indexOf(":");
    if (split < 0) continue;
    const key = line.slice(0, split).trim().toLowerCase();
    const value = line.slice(split + 1).trim();

    if (key === "sitemap") {
      if (value) sitemaps.push(value);
      continue;
    }

    if (key === "user-agent") {
      if (!current || current.rules.length) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      continue;
    }

    if ((key === "allow" || key === "disallow") && current) {
      current.rules.push({ type: key, path: value });
    }
  }

  const bot = USER_AGENT.split("/")[0].toLowerCase();
  const matching = groups.filter((g) => g.agents.some((a) => a === "*" || bot.includes(a))).flatMap((g) => g.rules);

  return {
    sitemaps,
    allows(pathname) {
      const candidates = matching.filter((r) => r.path && pathname.startsWith(r.path));
      if (!candidates.length) return true;
      candidates.sort((a, b) => b.path.length - a.path.length);
      return candidates[0].type === "allow";
    },
  };
}

async function getRobots(site: URL) {
  try {
    const robotsUrl = new URL("/robots.txt", site.origin).toString();
    const { response, body } = await safeFetch(robotsUrl, "text/plain,*/*;q=0.1");
    if (!response.ok) return parseRobots("");
    return parseRobots(body);
  } catch {
    return parseRobots("");
  }
}

function extractSitemapUrls(xml: string) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => match[1].replace(/&amp;/g, "&").trim())
    .filter(Boolean);
}

async function discoverFromSitemaps(site: URL, robots: RobotsRules) {
  const candidates = robots.sitemaps.length ? robots.sitemaps : [new URL("/sitemap.xml", site.origin).toString()];
  const urls: string[] = [];

  for (const sitemap of candidates.slice(0, 5)) {
    try {
      const { response, body } = await safeFetch(sitemap, "application/xml,text/xml,*/*;q=0.1");
      if (!response.ok) continue;
      for (const url of extractSitemapUrls(body)) {
        try {
          const parsed = new URL(url);
          if (parsed.hostname === site.hostname) urls.push(parsed.toString());
        } catch {}
      }
    } catch {}
  }

  return urls;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function tokenize(value: string) {
  return [...new Set(value.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [])].slice(0, 250);
}

function extractPage(html: string, pageUrl: URL) {
  const $ = load(html);
  $("script,style,noscript,template,svg,canvas").remove();

  const robots = ($('meta[name="robots"]').attr("content") || "").toLowerCase();
  const noindex = robots.split(",").some((v) => v.trim() === "noindex");
  const title = normalizeText($("title").first().text()) || pageUrl.hostname;
  const description = normalizeText($('meta[name="description"]').attr("content") || "");
  const bodyText = normalizeText($("body").text()).slice(0, 80_000);
  const headings = normalizeText($("h1,h2,h3").map((_, el) => $(el).text()).get().join(" ")).slice(0, 8_000);
  const canonicalRaw = $('link[rel="canonical"]').attr("href");
  let canonicalUrl = pageUrl.toString();
  if (canonicalRaw) {
    try { canonicalUrl = new URL(canonicalRaw, pageUrl).toString(); } catch {}
  }

  const links = $("a[href]").map((_, el) => $(el).attr("href")).get().flatMap((href) => {
    try {
      const url = new URL(href!, pageUrl);
      url.hash = "";
      return url.hostname === pageUrl.hostname && ["http:", "https:"].includes(url.protocol) ? [url.toString()] : [];
    } catch {
      return [];
    }
  });

  const combined = `${title} ${description} ${headings} ${bodyText}`;
  return { title, description, bodyText, headings, canonicalUrl, links: [...new Set(links)], noindex, terms: tokenize(combined) };
}

function docIdForUrl(url: string) {
  return Buffer.from(url).toString("base64url").slice(0, 1400);
}

async function indexPage(url: URL, siteSubmissionId: string, html: string) {
  const extracted = extractPage(html, url);
  if (extracted.noindex) return { indexed: false, links: extracted.links, reason: "noindex" };

  const safety = assessPageSafety(`${extracted.title}\n${extracted.description}\n${extracted.headings}\n${extracted.bodyText}`);
  const searchable = safety.decision === "allow";

  await adminDb.collection("indexedPages").doc(docIdForUrl(extracted.canonicalUrl)).set({
    url: url.toString(),
    canonicalUrl: extracted.canonicalUrl,
    hostname: url.hostname.toLowerCase(),
    siteSubmissionId,
    title: extracted.title,
    description: extracted.description,
    text: extracted.bodyText,
    headings: extracted.headings,
    terms: extracted.terms,
    safetyDecision: safety.decision,
    safetyCategories: safety.categories,
    searchable,
    crawledAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return { indexed: searchable, links: extracted.links, reason: safety.decision };
}

export async function crawlSite(seedUrl: string, siteSubmissionId: string) {
  const seed = new URL(seedUrl);
  const robots = await getRobots(seed);
  const sitemapUrls = await discoverFromSitemaps(seed, robots);
  const queue = [...new Set([seed.toString(), ...sitemapUrls])];
  const seen = new Set<string>();
  let indexed = 0;
  let skipped = 0;
  let failed = 0;

  while (queue.length && seen.size < MAX_PAGES_PER_SITE) {
    const raw = queue.shift()!;
    let url: URL;
    try { url = new URL(raw); } catch { continue; }
    url.hash = "";

    if (url.hostname !== seed.hostname || seen.has(url.toString()) || !robots.allows(url.pathname)) {
      skipped++;
      continue;
    }
    seen.add(url.toString());

    try {
      const { response, finalUrl, body } = await safeFetch(url.toString());
      const type = (response.headers.get("content-type") || "").toLowerCase();
      if (!response.ok || !type.includes("text/html")) {
        skipped++;
        continue;
      }
      if (finalUrl.hostname !== seed.hostname || !robots.allows(finalUrl.pathname)) {
        skipped++;
        continue;
      }

      const result = await indexPage(finalUrl, siteSubmissionId, body);
      if (result.indexed) indexed++; else skipped++;
      for (const link of result.links) {
        if (seen.size + queue.length >= MAX_PAGES_PER_SITE * 3) break;
        if (!seen.has(link)) queue.push(link);
      }
    } catch {
      failed++;
    }
  }

  await adminDb.collection("siteSubmissions").doc(siteSubmissionId).set({
    status: "indexed",
    lastCrawledAt: FieldValue.serverTimestamp(),
    stats: { crawled: seen.size, indexed, skipped, failed },
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return { crawled: seen.size, indexed, skipped, failed };
}

export async function processNextCrawlJobs(limit = 2) {
  const snapshot = await adminDb.collection("crawlJobs").where("status", "==", "queued").limit(Math.max(1, Math.min(limit, 5))).get();
  const results: unknown[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data() as { url?: string; siteSubmissionId?: string; attempts?: number };
    if (!data.url || !data.siteSubmissionId) continue;

    await doc.ref.set({ status: "running", startedAt: FieldValue.serverTimestamp(), attempts: (data.attempts || 0) + 1 }, { merge: true });
    try {
      const result = await crawlSite(data.url, data.siteSubmissionId);
      await doc.ref.set({ status: "done", result, finishedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      results.push({ jobId: doc.id, ok: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 500) : "Unknown crawl error";
      await doc.ref.set({ status: "failed", error: message, finishedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      await adminDb.collection("siteSubmissions").doc(data.siteSubmissionId).set({ status: "crawl-failed", error: message, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      results.push({ jobId: doc.id, ok: false, error: message });
    }
  }

  return results;
}
