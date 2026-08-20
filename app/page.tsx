"use client";

import { FormEvent, useState } from "react";

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
      <path d="m20 20-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function HomePage() {
  const [query, setQuery] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    window.location.href = `/search?q=${encodeURIComponent(q)}`;
  }

  return (
    <main className="home-shell">
      <header className="topbar">
        <nav className="topbar-left" aria-label="MPlace products">
          <a href="https://maps.mplace.cc">Maps</a>
          <a href="https://pages.mplace.cc">Pages</a>
        </nav>
        <nav className="topbar-right" aria-label="MPlace Search links">
          <a href="/submit">Add a website</a>
          <a href="/safety">Safety</a>
        </nav>
      </header>

      <section className="search-home" aria-labelledby="mplace-title">
        <a className="mplace-wordmark" href="/" id="mplace-title" aria-label="MPlace Search home">
          <span className="wordmark-symbol">M</span><span>Place</span>
        </a>
        <p className="home-product-name">Search</p>

        <form className="home-search-form" onSubmit={submit} role="search">
          <SearchIcon />
          <input
            aria-label="Search MPlace"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the web"
            autoFocus
            autoComplete="off"
          />
          <button type="submit" aria-label="Search">Search</button>
        </form>

        <div className="home-actions">
          <button type="button" onClick={() => document.querySelector<HTMLInputElement>(".home-search-form input")?.focus()}>
            MPlace Search
          </button>
          <a href="/submit">Add your website</a>
        </div>

        <p className="home-note">A growing index of submitted websites, with safety filtering built in for everyone.</p>
      </section>

      <footer className="home-footer">
        <div>MPlace Search Beta</div>
        <nav aria-label="Footer links">
          <a href="/submit">Submit</a>
          <a href="/safety">Safety</a>
          <a href="https://mplace.cc">MPlace</a>
        </nav>
      </footer>
    </main>
  );
}
