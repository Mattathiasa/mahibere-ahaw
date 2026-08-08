/**
 * Distance maths for suggesting the nearest Mahedher.
 *
 * Deliberately plain arithmetic rather than geohashing or a geo query library:
 * a congregation has tens of small groups, not thousands, so ranking them is a
 * loop over an array the page has already loaded. Firestore has no geo query
 * without extra indexing, and this project has no Cloud Functions to build one.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/** Addis Ababa. Where the map opens when nothing has been pinned yet. */
export const DEFAULT_CENTER: LatLng = { lat: 9.0300, lng: 38.7400 };

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * A distance a person can act on. Under a kilometre reads better in metres,
 * and the leading "≈" is honest: the pin is a rough marker, not a doorstep.
 */
export function formatDistance(km: number): string {
  if (!Number.isFinite(km)) return '';
  if (km < 1) return `≈${Math.round(km * 1000)} m`;
  if (km < 10) return `≈${km.toFixed(1)} km`;
  return `≈${Math.round(km)} km`;
}

/** True when both coordinates are present and inside the valid range. */
export function hasCoords(v: Partial<LatLng> | null | undefined): v is LatLng {
  return (
    !!v &&
    typeof v.lat === 'number' && Number.isFinite(v.lat) && Math.abs(v.lat) <= 90 &&
    typeof v.lng === 'number' && Number.isFinite(v.lng) && Math.abs(v.lng) <= 180
  );
}

/**
 * Pulls coordinates out of a pasted map link.
 *
 * Handles the shapes people actually paste — `.../@8.75,38.97,15z`, a `?q=`
 * or `?ll=` parameter, and the `!3d…!4d…` form Google puts in share links.
 * A short `maps.app.goo.gl` link carries no coordinates at all until it is
 * followed, so it correctly returns null and the user drags the pin instead.
 */
export function parseMapUrl(url: string): LatLng | null {
  const text = (url ?? '').trim();
  if (!text) return null;

  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,          // /@lat,lng,zoom
    /[?&](?:q|ll|center|daddr)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, // ?q=lat,lng
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,      // !3dlat!4dlng
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/, // a bare "lat, lng" paste
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (!m) continue;
    const candidate = { lat: Number(m[1]), lng: Number(m[2]) };
    if (hasCoords(candidate)) return candidate;
  }
  return null;
}

/**
 * Sorts by distance from `origin`, nearest first.
 *
 * Items without coordinates are kept with `km: null` and sorted last rather
 * than dropped: a group that nobody has pinned yet still exists and a member
 * should still be able to choose it.
 */
export function byDistanceFrom<T extends Partial<LatLng>>(
  origin: LatLng,
  items: T[]
): Array<T & { km: number | null }> {
  return items
    .map((item) => ({
      ...item,
      km: hasCoords(item) ? haversineKm(origin, item) : null,
    }))
    .sort((a, b) => {
      if (a.km === null && b.km === null) return 0;
      if (a.km === null) return 1;
      if (b.km === null) return -1;
      return a.km - b.km;
    });
}
