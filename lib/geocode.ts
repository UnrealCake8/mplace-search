export type GeocodedLocation = {
  latitude: number;
  longitude: number;
  displayName?: string;
  source: "nominatim";
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "MPlaceSearch/1.0 (+https://mplace.cc)";

export async function geocodeAddress(parts: {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
}): Promise<GeocodedLocation | null> {
  const query = [parts.name, parts.address, parts.city, parts.country]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(", ");

  if (!query) return null;

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Accept-Language": "en",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) return null;

    const results = (await response.json().catch(() => [])) as Array<{
      lat?: string;
      lon?: string;
      display_name?: string;
    }>;

    const first = results[0];
    if (!first?.lat || !first?.lon) return null;

    const latitude = Number(first.lat);
    const longitude = Number(first.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return {
      latitude,
      longitude,
      displayName: first.display_name,
      source: "nominatim",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
