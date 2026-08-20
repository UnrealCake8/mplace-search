"use client";

import { FormEvent, useState } from "react";

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
        <a className="brand-small" href="/">MPlace</a>
        <nav>
          <a href="/submit">Add a website</a>
          <a href="/safety">Safety</a>
        </nav>
      </header>

      <section className="hero">
        <div className="logo-mark">M</div>
        <h1>MPlace Search</h1>
        <p>Search the part of the web that has a place here.</p>
        <form className="search-form" onSubmit={submit}>
          <input
            aria-label="Search MPlace"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sites, people and places"
            autoFocus
          />
          <button type="submit">Search</button>
        </form>
        <div className="search-tabs" aria-label="Search categories">
          <span className="active">Web</span>
          <span>Places</span>
          <span>Pages</span>
        </div>
      </section>

      <footer>
        <span>MPlace Search beta</span>
        <a href="/submit">Submit a site</a>
        <a href="/safety">Safety</a>
      </footer>
    </main>
  );
}
