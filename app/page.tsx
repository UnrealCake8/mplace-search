"use client";

import { FormEvent, useState } from "react";
import { MPlaceBrand } from "../components/MPlaceBrand";
import styles from "./home.module.css";

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
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <nav className={styles.nav} aria-label="MPlace products">
          <a href="/business/add">Places</a>
          <a href="https://pages.mplace.cc">Pages</a>
          <a href="https://ads.mplace.cc">Ads</a>
        </nav>
        <nav className={styles.nav} aria-label="MPlace Search links">
          <a href="/submit">Add a website</a>
          <a href="/business/add">Add a business</a>
          <a className={styles.idButton} href="/id">MPlace ID</a>
        </nav>
      </header>

      <section className={styles.main} aria-labelledby="mplace-title">
        <a className={styles.homeBrand} href="/" id="mplace-title">
          <MPlaceBrand product="Search" />
        </a>

        <form className={styles.searchForm} onSubmit={submit} role="search">
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

        <div className={styles.actions}>
          <a href="/submit">Add your website</a>
          <a href="/business/add">Add your business</a>
        </div>

        <p className={styles.note}><strong>Safety filtering is always on.</strong> Search submitted websites and approved places without AI summaries.</p>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>MPlace Search · Part of the MPlace family</div>
        <div className={styles.footerBottom}>
          <nav aria-label="Footer product links">
            <a href="/business/add">Places</a>
            <a href="https://pages.mplace.cc">MPlace Pages</a>
            <a href="https://ads.mplace.cc">MPlace Ads</a>
          </nav>
          <nav aria-label="Footer account links">
            <a href="/safety">Safety</a>
            <a href="/id">MPlace ID</a>
            <a href="/submit">Add a website</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
