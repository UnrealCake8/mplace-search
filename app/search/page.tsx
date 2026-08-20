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
        <a className="results-brand" href="/" aria-label="MPlace Search home">
          <span className="wordmark-symbol">M</span><span>Place</span>
        </a>
        <form className="results-search-form" action="/search" method="get" role="search">
          <input name="q" defaultValue={query} aria-label="Search MPlace" placeholder="Search the web" autoComplete="off" />
          <button type="submit" aria-label="Search"><SearchIcon /></button>
        </form>
        <a className="header-submit-link" href="/submit">Add a website</a>
      </header>

      <div className="results-nav-wrap">
        <nav className="results-nav" aria-label="Search categories">
          <a className="active" href={query ? `/search?q=${encodeURIComponent(query)}` : "/search"}>Web</a>
          <span aria-disabled="true">Images <small>Soon</small></span>
          <span aria-disabled="true">Places <small>Soon</small></span>
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
              {results.map((result) => (
                <article className="result" key={result.url}>
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
            <p>No indexed pages matched <strong>{query}</strong>.</p>
            <p className="notice">MPlace Search only searches sites that have been submitted and crawled. You can add a website to the index.</p>
            <a className="header-submit-link" href="/submit">Add a website</a>
          </div>
        )}
      </section>
    </main>
  );
}
