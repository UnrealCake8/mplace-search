import { notFound } from "next/navigation";
import { MPlaceBrand } from "../../../components/MPlaceBrand";
import { adminDb } from "../../../lib/firebase/admin";

type PlacePageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

function openStreetMapUrl(name: string, address: string, latitude?: number, longitude?: number) {
  if (typeof latitude === "number" && typeof longitude === "number") {
    return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;
  }
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${name} ${address}`.trim())}`;
}

function openStreetMapEmbed(latitude: number, longitude: number) {
  const delta = 0.006;
  const bbox = `${longitude - delta}%2C${latitude - delta}%2C${longitude + delta}%2C${latitude + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

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
    location?: { latitude?: number; longitude?: number } | null;
  };

  if (data.searchable !== true || data.status !== "approved") notFound();

  const name = data.name || "Place";
  const address = [data.address, data.city, data.country].filter(Boolean).join(", ");
  const latitude = typeof data.location?.latitude === "number" ? data.location.latitude : undefined;
  const longitude = typeof data.location?.longitude === "number" ? data.location.longitude : undefined;
  const mapUrl = openStreetMapUrl(name, address, latitude, longitude);

  return (
    <main className="page-shell place-page-shell">
      <header>
        <a href="/"><MPlaceBrand compact product="Places" /></a>
        <a href="/search">Back to Search</a>
      </header>

      <section className="place-detail-layout">
        <div className="place-detail-copy">
          <p className="eyebrow">MPlace Places</p>
          <h1 className="page-title">{name}</h1>
          <p className="place-meta-line">{data.category || "Business"}{address ? ` · ${address}` : ""}</p>
          {data.description && <p className="place-description">{data.description}</p>}

          <div className="place-detail-actions">
            {data.website && <a className="primary-link" href={data.website} target="_blank" rel="noreferrer">Website</a>}
            {data.phone && <a className="secondary-link" href={`tel:${data.phone}`}>Call</a>}
            <a className="secondary-link" href={mapUrl} target="_blank" rel="noreferrer">OpenStreetMap</a>
          </div>
        </div>

        <div className="place-map-card">
          {typeof latitude === "number" && typeof longitude === "number" ? (
            <>
              <iframe
                title={`Map of ${name}`}
                src={openStreetMapEmbed(latitude, longitude)}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <p>Map data © OpenStreetMap contributors</p>
            </>
          ) : (
            <div className="place-map-empty">
              <strong>Map location not pinned yet</strong>
              <p>The listing has an address, but no latitude/longitude was supplied.</p>
              <a href={mapUrl} target="_blank" rel="noreferrer">Find it on OpenStreetMap</a>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
