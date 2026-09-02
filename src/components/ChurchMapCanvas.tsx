import React, { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { DEFAULT_CENTER, boundsOf, type LatLng } from '@/lib/geo';
import { makePinIcon, PIN_COLORS } from '@/lib/mapIcon';

/**
 * Many pins on one map.
 *
 * The sibling of LocationPicker, which edits exactly one pin. Kept separate
 * rather than generalised: the picker's whole job is the coordinate-entry
 * apparatus around a single marker (geolocation, pasted links, number inputs),
 * and none of that applies to a read-mostly overview of the whole church.
 *
 * OpenStreetMap tiles, same as the picker: no API key, no billing, no account.
 * They are fetched as images, so the Content-Security-Policy entry that matters
 * is `img-src` — see the tile host in vercel.json. A blocked tile host renders as
 * silent grey squares with no console error worth noticing, so if the map ever
 * goes blank, check that first.
 */

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  /** Primary label, already resolved to the reader's language by the caller. */
  title: string;
  /** Secondary line — city, or the congregation a group belongs to. */
  subtitle?: string;
  /**
   * Which layer this belongs to, and therefore its colour and size. Ordered by
   * rank in the structure — see PIN_COLORS.
   */
  kind: 'teklay' | 'zone' | 'zoneApprox' | 'atbiya' | 'mahder';
  /** Rendered inside the popup under the title. */
  detail?: React.ReactNode;
  /** Drawn dimmed, for a congregation marked inactive. */
  muted?: boolean;
}

/**
 * Frames the map on its content.
 *
 * `fitBounds` on a single point produces a zero-area box, which Leaflet renders
 * at maximum zoom — a street-level view of one church when the user asked to see
 * everything. One point is a `setView`; several are a fit.
 *
 * Deliberately keyed on the point IDENTITIES rather than the array: re-fitting on
 * every render would fight the user every time they panned.
 */
const FitToPoints: React.FC<{ points: LatLng[]; enabled: boolean }> = ({ points, enabled }) => {
  const map = useMap();
  const key = points.map((p) => `${p.lat},${p.lng}`).join('|');

  useEffect(() => {
    if (!enabled || points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14);
      return;
    }
    const bounds = boundsOf(points);
    if (bounds) map.fitBounds(bounds, { padding: [40, 40] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, map]);

  return null;
};

/** Click anywhere to place the pin, when a parish is selected for pinning. */
const ClickToPlace: React.FC<{ onPick: (p: LatLng) => void }> = ({ onPick }) => {
  useMapEvents({
    click(e) { onPick({ lat: e.latlng.lat, lng: e.latlng.lng }); },
  });
  return null;
};

interface ChurchMapCanvasProps {
  points: MapPoint[];
  /**
   * The pin being placed right now, if any. Drawn in the highlight colour and
   * draggable; clicking the map moves it.
   */
  placing?: { id: string; title: string; at: LatLng | null } | null;
  onPlace?: (p: LatLng) => void;
  /**
   * Any CSS length. A string lets a caller hand over a viewport-relative height
   * that keeps working through a resize or a rotation, which a pixel number read
   * from `window.innerHeight` at render time does not.
   */
  height?: number | string;
  /**
   * Drawn over the map's bottom-left corner. An overlay rather than a sibling in
   * page flow so the key stays with the thing it explains when the map is tall
   * enough to scroll past.
   */
  legend?: React.ReactNode;
}

export const ChurchMapCanvas: React.FC<ChurchMapCanvasProps> = ({
  points, placing = null, onPlace, height = 520, legend = null,
}) => {
  // Sized by rank as well as coloured, so the levels separate visually before
  // anyone reads the legend.
  const icons = useMemo(
    () => ({
      teklay: makePinIcon({ color: PIN_COLORS.teklay, size: 36 }),
      zone: makePinIcon({ color: PIN_COLORS.zone, size: 30 }),
      zoneApprox: makePinIcon({ color: PIN_COLORS.zoneApprox, size: 30 }),
      atbiya: makePinIcon({ color: PIN_COLORS.atbiya }),
      mahder: makePinIcon({ color: PIN_COLORS.mahder, size: 22 }),
      selected: makePinIcon({ color: PIN_COLORS.selected, size: 34, highlighted: true }),
    }),
    []
  );

  // Memoised: both of these fed a full marker rebuild on every render, which
  // stopped being free once the map carried every level of the structure.
  const coords = useMemo(() => points.map((p) => ({ lat: p.lat, lng: p.lng })), [points]);
  const first = coords[0] ?? placing?.at ?? DEFAULT_CENTER;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border" style={{ height }}>
      <MapContainer
        center={[first.lat, first.lng]}
        zoom={coords.length > 0 ? 6 : 11}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Only re-frame while not placing a pin: refitting mid-placement would
            yank the map out from under the click the user is about to make. */}
        <FitToPoints points={coords} enabled={!placing} />

        {placing && onPlace && <ClickToPlace onPick={onPlace} />}

        {points.map((p) => (
          <Marker
            key={`${p.kind}-${p.id}`}
            position={[p.lat, p.lng]}
            icon={icons[p.kind]}
            opacity={p.muted ? 0.5 : 1}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-bold text-sm font-ethiopic">{p.title}</p>
                {p.subtitle && <p className="text-xs text-muted-foreground">{p.subtitle}</p>}
                {p.detail}
              </div>
            </Popup>
          </Marker>
        ))}

        {placing?.at && (
          <Marker
            position={[placing.at.lat, placing.at.lng]}
            icon={icons.selected}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const { lat, lng } = e.target.getLatLng();
                onPlace?.({ lat, lng });
              },
            }}
          >
            <Popup>
              <p className="font-bold text-sm font-ethiopic">{placing.title}</p>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Above Leaflet's own panes, which sit at z-index 400-700. */}
      {legend && (
        <div className="absolute bottom-3 left-3 z-[1000] rounded-xl border border-border
                        bg-background/90 backdrop-blur-sm px-3 py-2 shadow-lg">
          {legend}
        </div>
      )}
    </div>
  );
};
