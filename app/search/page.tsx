type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

const demoResults = [
  {
    url: "https://mplace.cc",
    title: "MPlace",
    snippet: "Create, discover and explore places across the MPlace ecosystem.",
  },
  {
    url: "https://pages.mplace.cc",
    title: "MPlace Pages",
    snippet: "Make your own place on the internet and share it with others.",
  },
];

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  return (
    <main className="page-shell">
      <header><a className="brand-small" href="/">MPlace Search</a><a href="/submit">Add a website</a></header>
      <form className="search-form" action="/search" method="get">
        <input name="q" defaultValue={query} aria-label="Search MPlace" placeholder="Search sites, people and places" />
        <button type="submit">Search</button>
      </form>
      <div className="search-tabs" style={{justifyContent: "flex-start", marginBottom: "24px"}}>
        <span className="active">Web</span><span>Places</span><span>Pages</span>
      </div>
      {!query ? (
        <p className="notice">Enter something to search.</p>
      ) : (
        <section className="card">
          <p className="notice">Beta results for “{query}”. The live crawler/index backend is the next layer.</p>
          {demoResults.map((result) => (
            <article className="result" key={result.url}>
              <div className="result-url">{result.url}</div>
              <a className="result-title" href={result.url}>{result.title}</a>
              <div className="result-snippet">{result.snippet}</div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
