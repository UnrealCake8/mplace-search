"use client";

import { FormEvent, useEffect, useState } from "react";
import { MPlaceBrand } from "../../../components/MPlaceBrand";
import styles from "./manual-index.module.css";

type ManualPage = {
  id: string;
  url: string;
  title: string;
  description: string;
  hostname: string;
  searchable: boolean;
  safetyDecision: string;
};

export default function ManualIndexPage() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [headings, setHeadings] = useState("");
  const [pages, setPages] = useState<ManualPage[]>([]);
  const [message, setMessage] = useState("Loading manual index…");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadPages() {
    const response = await fetch("/api/admin/indexed-pages", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setPages([]);
      setMessage(data.error || "Could not load manual index entries.");
      return;
    }
    setPages(data.pages || []);
    setMessage((data.pages || []).length ? "" : "No manually indexed pages yet.");
  }

  useEffect(() => { void loadPages(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const response = await fetch("/api/admin/indexed-pages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, title, description, keywords, headings }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error || "Could not add this page to MPlace Search.");
      setBusy(false);
      return;
    }

    setUrl("");
    setTitle("");
    setDescription("");
    setKeywords("");
    setHeadings("");
    setMessage(data.searchable
      ? "Page added to MPlace Search and is searchable now."
      : `Page saved, but safety filtering marked it ${data.safetyDecision || "not searchable"}.`);
    await loadPages();
    setBusy(false);
  }

  async function remove(id: string) {
    setDeletingId(id);
    const response = await fetch("/api/admin/indexed-pages", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error || "Could not remove this manual index entry.");
      setDeletingId(null);
      return;
    }
    setPages((items) => items.filter((item) => item.id !== id));
    setMessage("Manual index entry removed.");
    setDeletingId(null);
  }

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <a href="/"><MPlaceBrand compact product="Admin" /></a>
        <nav>
          <a href="/admin/review">Business review</a>
          <a href="/id">MPlace ID</a>
          <a href="/">Search</a>
        </nav>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>MPlace Admin</p>
        <h1>Manual indexing</h1>
        <p>Add a page directly to the existing MPlace Search index without running the crawler. Crawler submissions, businesses, and all existing search features stay unchanged.</p>
      </section>

      <section className={styles.panel}>
        <form className={styles.form} onSubmit={submit}>
          <label>
            <span>Page URL</span>
            <input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/about" required />
          </label>

          <label>
            <span>Search title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="About Example" maxLength={300} required />
          </label>

          <label>
            <span>SEO description</span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A short description that should appear in MPlace Search results." maxLength={1000} rows={4} required />
          </label>

          <label>
            <span>Keywords <small>optional, comma separated</small></span>
            <input value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="example, about, company" />
          </label>

          <label>
            <span>Headings / extra search text <small>optional</small></span>
            <textarea value={headings} onChange={(event) => setHeadings(event.target.value)} placeholder="About us, Our mission, Contact" maxLength={4000} rows={3} />
          </label>

          <button type="submit" disabled={busy}>{busy ? "Adding…" : "Add to MPlace Search"}</button>
        </form>
      </section>

      {message && <p className={styles.message} role="status">{message}</p>}

      <section className={styles.entries} aria-label="Manually indexed pages">
        <div className={styles.entriesHeader}>
          <div>
            <p className={styles.eyebrow}>Manual index</p>
            <h2>Recent entries</h2>
          </div>
          <button type="button" className={styles.refresh} onClick={() => void loadPages()}>Refresh</button>
        </div>

        {pages.map((page) => (
          <article className={styles.card} key={page.id}>
            <div className={styles.cardMain}>
              <div className={styles.badges}>
                <span>Manual</span>
                <span className={page.searchable ? styles.live : styles.blocked}>{page.searchable ? "Searchable" : page.safetyDecision}</span>
              </div>
              <h3>{page.title}</h3>
              <a href={page.url} target="_blank" rel="noreferrer">{page.url}</a>
              <p>{page.description}</p>
            </div>
            <button type="button" className={styles.remove} disabled={deletingId === page.id} onClick={() => void remove(page.id)}>
              {deletingId === page.id ? "Removing…" : "Remove"}
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
