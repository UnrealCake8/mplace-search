import { notFound } from "next/navigation";
import { MPlaceBrand } from "../../../components/MPlaceBrand";
import { adminDb } from "../../../lib/firebase/admin";

type PlacePageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export default async function PlacePage({ params }: PlacePageProps) {
  const { id } = await params;
  const snapshot = await adminDb.collection("businesses").doc(id).get();
  if (!snapshot.exists) notFound();

  const data = snapshot.data() as {
    searchable?: boolean;
    status?: string;
    name?: string;
    category?: string;
    address?: string;
    city?: string;
    country?: string;
    website?: string | null;
    phone?: string | null;
    description?: string | null;
  };

  if (data.searchable !== true || data.status !== "approved") notFound();

  const address = [data.address, data.city, data.country].filter(Boolean).join(", ");

  return (
    <main className="page-shell">
      <header>
        <a href="/"><MPlaceBrand compact product="Places" /></a>
        <a href="/search">Back to Search</a>
      </header>
      <section className="card stack">
        <p className="eyebrow">MPlace Places</p>
        <h1 className="page-title">{data.name || "Place"}</h1>
        <p className="notice"><strong>{data.category || "Business"}</strong>{address ? ` · ${address}` : ""}</p>
        {data.description && <p className="notice">{data.description}</p>}
        <div className="identity-actions">
          {data.website && <a className="primary-link" href={data.website} target="_blank" rel="noreferrer">Website</a>}
          {data.phone && <a className="secondary-link" href={`tel:${data.phone}`}>Call {data.phone}</a>}
        </div>
      </section>
    </main>
  );
}
