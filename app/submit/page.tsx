"use client";

import { FormEvent, useState } from "react";

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
      <header><a className="brand-small" href="/">MPlace Search</a><a href="/safety">Safety</a></header>
      <div className="stack">
        <div>
          <h1 style={{fontSize: "42px"}}>Add a website</h1>
          <p className="notice">Submit a public website for consideration. MPlace will only index pages that pass its safety, spam and crawler rules.</p>
        </div>
        <form className="card stack" onSubmit={submit}>
          <div className="stack" style={{gap: "8px"}}>
            <label htmlFor="site-url">Website address</label>
            <input
              id="site-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              inputMode="url"
              autoComplete="url"
              disabled={submitting}
            />
          </div>
          <button className="primary" type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit website"}
          </button>
          {message && <p className="notice" role="status">{message}</p>}
        </form>
      </div>
    </main>
  );
}
