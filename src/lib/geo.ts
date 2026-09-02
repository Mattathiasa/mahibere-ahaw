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
// Constrained to `object`, not `Partial<LatLng>`. Every property of
// `Partial<LatLng>` is optional, which makes it a WEAK type: TypeScript then
// rejects any argument sharing no property with it, so an unpinned
// `{ id: 'unpinned' }` — the exact case this function exists to handle — was a
// type error at every call site. Six of the twenty-four baseline errors were this
// one signature.
/**
 * Splits a list into the items that carry coordinates and those that do not.
 *
 * The church map is as much a data-completeness tool as a map: the useful number
 * for whoever maintains the registry is how many congregations still have no pin,
 * and the unpinned list is the worklist for fixing that.
 */
export function splitByPinned<T extends object>(
  items: readonly T[]
): { pinned: T[]; unpinned: T[] } {
  const pinned: T[] = [];
  const unpinned: T[] = [];
  for (const item of items) {
    (hasCoords(item as Partial<LatLng>) ? pinned : unpinned).push(item);
  }
  return { pinned, unpinned };
}

/**
 * The mean position of some points, or null when there are none.
 *
 * Used to place a body that has no pin of its own at the middle of the units
 * beneath it — a diocese at the centre of its congregations. That is an
 * ESTIMATE, and callers must render it as one: a marker that looks surveyed but
 * was averaged is worse than an honest gap, which is the same reasoning that
 * keeps `emptyAtbiya()` from defaulting lat/lng to 0,0.
 *
 * A plain arithmetic mean, not a spherical centroid. Over one country the
 * difference is metres, and the result is only ever a label position.
 */
export function centroidOf(points: readonly LatLng[]): LatLng | null {
  if (points.length === 0) return null;
  let lat = 0, lng = 0;
  for (const p of points) { lat += p.lat; lng += p.lng; }
  return { lat: lat / points.length, lng: lng / points.length };
}

/**
 * The south-west / north-east corners enclosing every point, in the tuple shape
 * Leaflet's `fitBounds` takes. Null when there is nothing to enclose.
 *
 * A single point yields a zero-area box, which `fitBounds` renders at maximum
 * zoom — so callers should treat one point as a `setView`, not a fit. See
 * ChurchMapCanvas.
 */
export function boundsOf(
  points: readonly LatLng[]
): [[number, number], [number, number]] | null {
  if (points.length === 0) return null;
  let south = points[0].lat, north = points[0].lat;
  let west = points[0].lng, east = points[0].lng;
  for (const p of points) {
    if (p.lat < south) south = p.lat;
    if (p.lat > north) north = p.lat;
    if (p.lng < west) west = p.lng;
    if (p.lng > east) east = p.lng;
  }
  return [[south, west], [north, east]];
}

export function byDistanceFrom<T extends object>(
  origin: LatLng,
  items: readonly T[]
): Array<T & { km: number | null }> {
  return items
    .map((item) => ({
      ...item,
      km: hasCoords(item as Partial<LatLng>) ? haversineKm(origin, item as LatLng) : null,
    }))
    .sort((a, b) => {
      if (a.km === null && b.km === null) return 0;
      if (a.km === null) return 1;
      if (b.km === null) return -1;
      return a.km - b.km;
    });
}
