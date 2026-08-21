import { adminDb } from "./firebase/admin";

export type SearchResult = {
  id: string;
  kind: "web" | "business";
  url: string;
  domain: string;
  title: string;
  snippet: string;
  score: number;
  address?: string;
  category?: string;
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

  const lookupTerm = [...terms].sort((a, b) => b.length - a.length)[0];

  const [pageSnapshot, businessSnapshot] = await Promise.all([
    adminDb.collection("indexedPages").where("terms", "array-contains", lookupTerm).limit(75).get(),
    adminDb.collection("businesses").where("searchTerms", "array-contains", lookupTerm).limit(50).get(),
  ]);

  const webResults = pageSnapshot.docs.flatMap((doc) => {
    const data = doc.data() as {
      searchable?: boolean;
      url?: string;
      canonicalUrl?: string;
      hostname?: string;
      title?: string;
      description?: string;
      text?: string;
      headings?: string;
    };

    if (data.searchable !== true) return [];

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

    return [{ id: `web:${doc.id}`, kind: "web" as const, url, domain, title, snippet: makeSnippet(text, description, terms), score }];
  });

  const businessResults = businessSnapshot.docs.flatMap((doc) => {
    const data = doc.data() as {
      searchable?: boolean;
      status?: string;
      name?: string;
      category?: string;
      address?: string;
      city?: string;
      country?: string;
      website?: string | null;
      description?: string | null;
    };

    if (data.searchable !== true || data.status !== "approved") return [];

    const title = data.name || "Untitled business";
    const category = data.category || "Business";
    const address = [data.address, data.city, data.country].filter(Boolean).join(", ");
    const description = data.description || `${category}${address ? ` in ${address}` : ""}`;
    const searchableText = `${title} ${category} ${address} ${description}`.toLowerCase();
    let score = 12;
    for (const term of terms) {
      if (title.toLowerCase() === query.toLowerCase()) score += 40;
      score += Math.min(countOccurrences(title.toLowerCase(), term), 3) * 12;
      score += Math.min(countOccurrences(category.toLowerCase(), term), 3) * 6;
      score += Math.min(countOccurrences(searchableText, term), 6) * 2;
    }

    const url = data.website || "";
    const domain = url ? new URL(url).hostname : "MPlace Places";
    return [{ id: `business:${doc.id}`, kind: "business" as const, url, domain, title, snippet: description, score, address, category }];
  });

  return [...businessResults, ...webResults]
    .filter((result) => result.kind === "business" || result.url)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}
