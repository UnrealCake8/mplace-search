"use client";

import { FormEvent, useState } from "react";
import { MPlaceBrand } from "../../components/MPlaceBrand";

export default function SubmitPage() {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = url.trim();
    if (!/^https?:\/\//i.test(value)) {
      setMessage("Enter a full http:// or https:// website address.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/sites/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      setMessage(result.message ?? result.error ?? "Something went wrong while submitting the site.");
      if (response.ok) setUrl("");
    } catch {
      setMessage("MPlace could not submit that website right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <header><a href="/"><MPlaceBrand compact product="Search" /></a><nav className="results-account-nav"><a href="/business/add">Add a business</a><a className="id-pill" href="/id">MPlace ID</a></nav></header>
      <div className="stack">
        <div>
          <p className="eyebrow">MPlace Search</p>
          <h1 className="page-title">Add a website</h1>
          <p className="notice">Submit a public website for consideration. MPlace only indexes pages that pass its safety, spam and crawler rules.</p>
        </div>
        <form className="card stack" onSubmit={submit}>
          <label htmlFor="site-url">Website address
            <input
              id="site-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              inputMode="url"
              autoComplete="url"
              disabled={submitting}
            />
          </label>
          <button className="primary" type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit website"}</button>
          {message && <p className="notice" role="status">{message}</p>}
        </form>
        <p className="notice">Want to add a physical place instead? <a className="inline-link" href="/business/add">Add your business to MPlace Places.</a></p>
      </div>
    </main>
  );
}
