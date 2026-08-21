"use client";

import { FormEvent, useState } from "react";
import { MPlaceBrand } from "../components/MPlaceBrand";

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
      <div className="brand-shape shape-green" />
      <div className="brand-shape shape-coral" />
      <div className="brand-shape shape-violet" />
      <div className="brand-shape shape-cyan" />

      <header className="topbar">
        <nav className="topbar-left" aria-label="MPlace products">
          <a href="/business/add">Places</a>
          <a href="https://pages.mplace.cc">Pages</a>
        </nav>
        <nav className="topbar-right" aria-label="MPlace Search links">
          <a href="/submit">Add a website</a>
          <a href="/business/add">Add a business</a>
          <a className="id-pill" href="/id">MPlace ID</a>
        </nav>
      </header>

      <section className="search-home" aria-labelledby="mplace-title">
        <div className="hero-kicker">THE MPLACE INDEX</div>
        <a className="home-brand" href="/" id="mplace-title"><MPlaceBrand product="Search" /></a>
        <p className="hero-copy">Search websites and places that have been submitted to MPlace, with safety filtering built in from the start.</p>

        <form className="home-search-form" onSubmit={submit} role="search">
          <SearchIcon />
          <input
            aria-label="Search MPlace"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search MPlace"
            autoFocus
            autoComplete="off"
          />
          <button type="submit" aria-label="Search">Search</button>
        </form>

        <div className="home-actions">
          <a className="action-green" href="/submit"><span>↗</span>Add your website</a>
          <a className="action-gold" href="/business/add"><span>⌖</span>Add your business</a>
        </div>

        <div className="feature-ribbon" aria-label="MPlace Search principles">
          <span><i className="dot green" />Community-submitted</span>
          <span><i className="dot coral" />Safety-first</span>
          <span><i className="dot violet" />No AI summaries</span>
          <span><i className="dot cyan" />Independent index</span>
        </div>
      </section>

      <footer className="home-footer">
        <div><strong>MPlace Search</strong> <span>Beta</span></div>
        <nav aria-label="Footer links">
          <a href="/safety">Safety</a>
          <a href="/id">MPlace ID</a>
          <a href="https://mplace.cc">MPlace</a>
        </nav>
      </footer>
    </main>
  );
}
