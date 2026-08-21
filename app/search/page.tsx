import { MPlaceBrand } from "../../components/MPlaceBrand";
import { searchIndex } from "../../lib/search-index";
import styles from "./search.module.css";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19">
      <path d="m20 20-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function osmUrl(result: { latitude?: number; longitude?: number; address?: string; title: string }) {
  if (typeof result.latitude === "number" && typeof result.longitude === "number") {
    return `https://www.openstreetmap.org/?mlat=${result.latitude}&mlon=${result.longitude}#map=17/${result.latitude}/${result.longitude}`;
  }
  const search = [result.title, result.address].filter(Boolean).join(" ");
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(search)}`;
}

function cleanCategory(category?: string) {
  const value = category?.trim();
  if (!value || value.toLowerCase() === "unknown") return "";
  return value;
}

function cleanAddress(address?: string) {
  const value = address?.trim();
  if (!value) return "";
  return value.replace(/^Unnamed Road\s*[-–—·,]?\s*/i, "").trim();
}

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query ? await searchIndex(query).catch(() => []) : [];

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="MPlace Search home">
          <MPlaceBrand compact product="Search" />
        </a>
        <form className={styles.searchForm} action="/search" method="get" role="search">
          <input name="q" defaultValue={query} aria-label="Search MPlace" placeholder="Search MPlace" autoComplete="off" />
          <button type="submit" aria-label="Search"><SearchIcon /></button>
        </form>
        <nav className={styles.accountNav}>
          <a href="/business/add">Business</a>
          <a href="/id" className={styles.idButton}>MPlace ID</a>
        </nav>
      </header>

      <div className={styles.tabsWrap}>
        <nav className={styles.tabs} aria-label="Search categories">
          <a className={styles.active} href={query ? `/search?q=${encodeURIComponent(query)}` : "/search"}>All</a>
          <span>Images <small>Soon</small></span>
          <a href="/business/add">Places</a>
          <span>Pages <small>Soon</small></span>
        </nav>
      </div>

      <section className={styles.content}>
        {!query ? (
          <p className={styles.muted}>Enter something to search.</p>
        ) : results.length ? (
          <>
            <p className={styles.meta}>{results.length} result{results.length === 1 ? "" : "s"} for <strong>{query}</strong></p>
            <div className={styles.resultsList}>
              {results.map((result) => {
                if (result.kind === "business") {
                  const category = cleanCategory(result.category);
                  const address = cleanAddress(result.address);
                  const metadata = [category, address].filter(Boolean).join(" · ");

                  return (
                    <article className={`${styles.result} ${styles.placeResult}`} key={result.id}>
                      <div className={styles.placeEyebrow}>MPlace Places</div>
                      <a className={styles.title} href={result.url}>{result.title}</a>
                      {metadata && <p className={styles.placeMeta}>{metadata}</p>}
                      {result.snippet && result.snippet.trim() !== metadata && (
                        <p className={styles.snippet}>{result.snippet}</p>
                      )}
                      <div className={styles.placeActions}>
                        <a href={result.url}>Place details</a>
                        <a href={osmUrl(result)} target="_blank" rel="noreferrer">Directions</a>
                      </div>
                    </article>
                  );
                }

                return (
                  <article className={styles.result} key={result.id}>
                    <a className={styles.sourceRow} href={result.url}>
                      <span className={styles.webIcon}>{result.domain.charAt(0).toUpperCase()}</span>
                      <div><strong>{result.domain}</strong><small>{result.url}</small></div>
                    </a>
                    <a className={styles.title} href={result.url}>{result.title}</a>
                    {result.snippet && <p className={styles.snippet}>{result.snippet}</p>}
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div>
            <p>No indexed pages or places matched <strong>{query}</strong>.</p>
            <p className={styles.muted}>MPlace Search searches crawled websites and approved MPlace Places listings.</p>
          </div>
        )}
      </section>
    </main>
  );
}
