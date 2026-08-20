import { adminDb } from "./firebase/admin";

export type SearchResult = {
  url: string;
  domain: string;
  title: string;
  snippet: string;
  score: number;
};

function tokenize(value: string) {
  return [...new Set(value.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [])].slice(0, 12);
}

function countOccurrences(haystack: string, needle: string) {
  if (!needle) return 0;
  let count = 0;
  let start = 0;
  while ((start = haystack.indexOf(needle, start)) !== -1) {
    count++;
    start += needle.length;
  }
  return count;
}

function makeSnippet(text: string, description: string, terms: string[]) {
  if (description) return description.slice(0, 240);
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const lower = clean.toLowerCase();
  const hit = terms.map((term) => lower.indexOf(term)).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, hit - 70);
  const snippet = clean.slice(start, start + 240);
  return `${start > 0 ? "…" : ""}${snippet}${start + 240 < clean.length ? "…" : ""}`;
}

export async function searchIndex(query: string): Promise<SearchResult[]> {
  const terms = tokenize(query);
  if (!terms.length) return [];

  // Firestore has no native full-text search. For this MVP we use the most
  // distinctive query token as the candidate lookup, then rank candidates in memory.
  const lookupTerm = [...terms].sort((a, b) => b.length - a.length)[0];
  const snapshot = await adminDb
    .collection("indexedPages")
    .where("searchable", "==", true)
    .where("terms", "array-contains", lookupTerm)
    .limit(50)
    .get();

  const results = snapshot.docs.map((doc) => {
    const data = doc.data() as {
      url?: string;
      canonicalUrl?: string;
      hostname?: string;
      title?: string;
      description?: string;
      text?: string;
      headings?: string;
    };

    const title = data.title || data.hostname || "Untitled";
    const description = data.description || "";
    const text = data.text || "";
    const headings = data.headings || "";
    const url = data.canonicalUrl || data.url || "";
    const domain = data.hostname || (url ? new URL(url).hostname : "");

    const titleLower = title.toLowerCase();
    const headingLower = headings.toLowerCase();
    const descriptionLower = description.toLowerCase();
    const textLower = text.toLowerCase();
    const domainLower = domain.toLowerCase();

    let score = 0;
    for (const term of terms) {
      if (titleLower === query.toLowerCase()) score += 30;
      if (domainLower.includes(term)) score += 10;
      score += Math.min(countOccurrences(titleLower, term), 3) * 8;
      score += Math.min(countOccurrences(headingLower, term), 4) * 4;
      score += Math.min(countOccurrences(descriptionLower, term), 4) * 3;
      score += Math.min(countOccurrences(textLower, term), 8);
    }

    return {
      url,
      domain,
      title,
      snippet: makeSnippet(text, description, terms),
      score,
    };
  });

  return results
    .filter((result) => result.url)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}
