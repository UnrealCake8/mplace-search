"use client";

import { FormEvent, useState } from "react";
import { MPlaceBrand } from "../../../components/MPlaceBrand";

export default function AddBusinessPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setMessage("");
    const form = new FormData(formElement);
    const latitudeText = String(form.get("latitude") || "").trim();
    const longitudeText = String(form.get("longitude") || "").trim();
    const payload = {
      name: form.get("name"), category: form.get("category"), address: form.get("address"), city: form.get("city"), country: form.get("country"),
      website: form.get("website"), phone: form.get("phone"), description: form.get("description"),
      latitude: latitudeText ? Number(latitudeText) : null,
      longitude: longitudeText ? Number(longitudeText) : null,
    };
    try {
      const response = await fetch("/api/businesses", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        setMessage("Please sign in with MPlace ID first.");
        return;
      }
      if (!response.ok) throw new Error(data.error || "Could not submit business.");
      setMessage(data.message || "Business submitted.");
      formElement.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit business.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-shell business-page">
      <header><a href="/"><MPlaceBrand compact product="Places" /></a><a href="/id">MPlace ID</a></header>
      <div className="stack">
        <div>
          <p className="eyebrow">MPlace Places</p>
          <h1 className="page-title">Add your business</h1>
          <p className="notice">Create a structured place listing for future MPlace Maps and place search. Listings are reviewed before becoming searchable.</p>
        </div>
        <form className="card stack" onSubmit={submit}>
          <div className="form-grid">
            <label>Business name<input name="name" required /></label>
            <label>Category<input name="category" placeholder="Cafe, school, game studio…" required /></label>
          </div>
          <label>Address<input name="address" required /></label>
          <div className="form-grid">
            <label>City<input name="city" required /></label>
            <label>Country<input name="country" required /></label>
          </div>
          <div className="form-grid">
            <label>Website<input name="website" type="url" placeholder="https://example.com" /></label>
            <label>Phone<input name="phone" type="tel" /></label>
          </div>
          <label>Description<textarea name="description" rows={4} placeholder="What should people know about this place?" /></label>
          <details className="location-details">
            <summary>Map coordinates (optional)</summary>
            <p className="notice">Latitude/longitude make the listing ready for a future map pin. We can add address-to-pin geocoding later.</p>
            <div className="form-grid">
              <label>Latitude<input name="latitude" type="number" min="-90" max="90" step="any" /></label>
              <label>Longitude<input name="longitude" type="number" min="-180" max="180" step="any" /></label>
            </div>
          </details>
          <button className="primary" disabled={busy}>{busy ? "Submitting…" : "Submit business"}</button>
          {message && <p className="notice" role="status">{message} {message.includes("sign in") && <a className="inline-link" href="/id">Open MPlace ID</a>}</p>}
        </form>
      </div>
    </main>
  );
}
