import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getMPlaceUser } from "../../../lib/auth/session";
import { adminDb } from "../../../lib/firebase/admin";
import { geocodeAddress } from "../../../lib/geocode";

function clean(value: unknown, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  const user = await getMPlaceUser();
  if (!user) return NextResponse.json({ error: "Sign in with MPlace ID first." }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = clean(body?.name, 120);
  const category = clean(body?.category, 80);
  const address = clean(body?.address, 220);
  const city = clean(body?.city, 100);
  const country = clean(body?.country, 100);
  const website = clean(body?.website, 500);
  const phone = clean(body?.phone, 50);
  const description = clean(body?.description, 800);
  const latitude = typeof body?.latitude === "number" ? body.latitude : null;
  const longitude = typeof body?.longitude === "number" ? body.longitude : null;

  if (!name || !category || !address || !city || !country) {
    return NextResponse.json({ error: "Name, category, address, city and country are required." }, { status: 400 });
  }

  if (website) {
    try {
      const url = new URL(website);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch {
      return NextResponse.json({ error: "Enter a valid website address." }, { status: 400 });
    }
  }

  if (latitude !== null && (latitude < -90 || latitude > 90)) return NextResponse.json({ error: "Invalid latitude." }, { status: 400 });
  if (longitude !== null && (longitude < -180 || longitude > 180)) return NextResponse.json({ error: "Invalid longitude." }, { status: 400 });

  let location = latitude !== null && longitude !== null
    ? { latitude, longitude, source: "manual" as const }
    : null;
  let geocodeDisplayName: string | null = null;

  if (!location) {
    const geocoded = await geocodeAddress({ name, address, city, country });
    if (geocoded) {
      location = {
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        source: geocoded.source,
      };
      geocodeDisplayName = geocoded.displayName || null;
    }
  }

  const searchTerms = [...new Set(`${name} ${category} ${address} ${city} ${country}`.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [])].slice(0, 100);
  const ref = await adminDb.collection("businesses").add({
    name,
    category,
    address,
    city,
    country,
    website: website || null,
    phone: phone || null,
    description: description || null,
    location,
    geocodeDisplayName,
    geocodedAt: location?.source === "nominatim" ? FieldValue.serverTimestamp() : null,
    ownerUid: user.uid,
    status: "pending-review",
    searchable: false,
    searchTerms,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({
    ok: true,
    id: ref.id,
    geocoded: Boolean(location),
    message: location
      ? "Business submitted to MPlace Places for review. Map location found."
      : "Business submitted to MPlace Places for review. Map location could not be found automatically.",
  });
}
