"use client";

import { useEffect, useState } from "react";
import { MPlaceBrand } from "../../../components/MPlaceBrand";

type Business = {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  country: string;
  website?: string | null;
  phone?: string | null;
  description?: string | null;
  ownerUid?: string | null;
  status: string;
};

export default function AdminReviewPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [message, setMessage] = useState("Loading pending businesses…");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/admin/businesses", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setBusinesses([]);
      setMessage(data.error || "Could not load admin reviews.");
      return;
    }
    setBusinesses(data.businesses || []);
    setMessage((data.businesses || []).length ? "" : "No businesses are waiting for review.");
  }

  useEffect(() => { void load(); }, []);

  async function review(id: string, action: "approve" | "reject") {
    setBusyId(id);
    const response = await fetch("/api/admin/businesses", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error || "Could not update that business.");
      setBusyId(null);
      return;
    }
    setBusinesses((items) => items.filter((item) => item.id !== id));
    setMessage(action === "approve" ? "Business approved and made searchable." : "Business rejected.");
    setBusyId(null);
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a href="/"><MPlaceBrand compact product="Admin" /></a>
        <div className="admin-header-links"><a href="/admin/index">Manual index</a><a href="/id">MPlace ID</a><a href="/">Search</a></div>
      </header>

      <section className="admin-hero">
        <p className="eyebrow">MPlace Admin</p>
        <h1>Business review</h1>
        <p>Approve listings that belong in MPlace Places. Approved businesses become searchable immediately.</p>
      </section>

      {message && <p className="admin-message" role="status">{message}</p>}

      <section className="review-grid">
        {businesses.map((business) => (
          <article className="review-card" key={business.id}>
            <div className="review-card-top">
              <div>
                <span className="review-badge">Pending review</span>
                <h2>{business.name}</h2>
                <p className="review-category">{business.category}</p>
              </div>
              <div className="review-dot" aria-hidden="true" />
            </div>
            <div className="review-details">
              <p><strong>Address</strong><span>{business.address}, {business.city}, {business.country}</span></p>
              {business.website && <p><strong>Website</strong><a href={business.website} target="_blank" rel="noreferrer">{business.website}</a></p>}
              {business.phone && <p><strong>Phone</strong><span>{business.phone}</span></p>}
              {business.description && <p><strong>Description</strong><span>{business.description}</span></p>}
            </div>
            <div className="review-actions">
              <button className="approve-button" disabled={busyId === business.id} onClick={() => review(business.id, "approve")}>Approve</button>
              <button className="reject-button" disabled={busyId === business.id} onClick={() => review(business.id, "reject")}>Reject</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
