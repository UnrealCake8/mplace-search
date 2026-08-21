import { MPlaceBrand } from "../../components/MPlaceBrand";
import { searchIndex } from "../../lib/search-index";

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

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query ? await searchIndex(query).catch(() => []) : [];

  return (
    <main className="results-shell">
      <header className="results-header">
        <a className="results-brand" href="/" aria-label="MPlace Search home"><MPlaceBrand compact product="Search" /></a>
        <form className="results-search-form" action="/search" method="get" role="search">
          <input name="q" defaultValue={query} aria-label="Search MPlace" placeholder="Search MPlace" autoComplete="off" />
          <button type="submit" aria-label="Search"><SearchIcon /></button>
        </form>
        <nav className="results-account-nav"><a href="/business/add">Business</a><a href="/id" className="id-pill">MPlace ID</a></nav>
      </header>

      <div className="results-nav-wrap">
        <nav className="results-nav" aria-label="Search categories">
          <a className="active" href={query ? `/search?q=${encodeURIComponent(query)}` : "/search"}>All</a>
          <span aria-disabled="true">Images <small>Soon</small></span>
          <a href="/business/add">Places</a>
          <span aria-disabled="true">Pages <small>Soon</small></span>
        </nav>
      </div>

      <section className="results-content">
        {!query ? (
          <p className="notice">Enter something to search.</p>
        ) : results.length ? (
          <>
            <p className="results-meta">{results.length} result{results.length === 1 ? "" : "s"} for <strong>{query}</strong></p>
            <div className="results-list">
              {results.map((result) => result.kind === "business" ? (
                <article className="result place-result" key={result.id}>
                  <div className="place-result-label">MPlace Places</div>
                  <div className="result-source">
                    <span className="result-favicon">{result.title.charAt(0).toUpperCase()}</span>
                    <span><strong>{result.title}</strong><small>{result.category}{result.address ? ` · ${result.address}` : ""}</small></span>
                  </div>
                  {result.url ? <a className="result-title" href={result.url}>{result.title}</a> : <div className="result-title result-title-static">{result.title}</div>}
                  {result.snippet && <p className="result-snippet">{result.snippet}</p>}
                  {result.url && <a className="place-website-link" href={result.url}>Visit website</a>}
                </article>
              ) : (
                <article className="result" key={result.id}>
                  <a className="result-source" href={result.url}>
                    <span className="result-favicon">{result.domain.charAt(0).toUpperCase()}</span>
                    <span><strong>{result.domain}</strong><small>{result.url}</small></span>
                  </a>
                  <a className="result-title" href={result.url}>{result.title}</a>
                  {result.snippet && <p className="result-snippet">{result.snippet}</p>}
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-results">
            <p>No indexed pages or places matched <strong>{query}</strong>.</p>
            <p className="notice">MPlace Search searches crawled websites and approved MPlace Places listings.</p>
            <div className="empty-actions"><a href="/submit">Add a website</a><a href="/business/add">Add a business</a></div>
          </div>
        )}
      </section>
    </main>
  );
}
