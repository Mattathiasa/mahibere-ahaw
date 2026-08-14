import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, Loader2, MapPin, X } from 'lucide-react';
import { DEFAULT_CENTER, hasCoords, parseMapUrl, type LatLng } from '@/lib/geo';
import { makePinIcon } from '@/lib/mapIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Drops a pin on a map, for a Mahedher's meeting place or a member's home.
 *
 * OpenStreetMap tiles: no API key, no billing, no account. The trade is that
 * the map needs network to draw — so the coordinates are also shown and
 * editable as plain numbers, and a pasted map link works too. Someone on a poor
 * connection can still place a pin.
 */

/**
 * Moved to lib/mapIcon.ts when the church map needed the same pin in other
 * colours. The reason it is an inline SVG rather than Leaflet's default marker is
 * recorded there.
 */
const pinIcon = makePinIcon();

/** Click anywhere on the map to move the pin there. */
const ClickToPlace: React.FC<{ onPick: (p: LatLng) => void }> = ({ onPick }) => {
  useMapEvents({
    click(e) { onPick({ lat: e.latlng.lat, lng: e.latlng.lng }); },
  });
  return null;
};

/** Re-centres when the value changes from outside (geolocation, pasted link). */
const Recenter: React.FC<{ center: LatLng }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center.lat, center.lng, map]);
  return null;
};

interface LocationPickerProps {
  value: Partial<LatLng> | null | undefined;
  onChange: (next: LatLng | null) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  /** Map height. Shorter inside a dialog than on a full page. */
  height?: number;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value, onChange, label, hint, disabled = false, height = 240,
}) => {
  const { t } = useLanguage();
  const a = t.admin;
  const pin = hasCoords(value) ? value : null;
  const [locating, setLocating] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const center = useMemo<LatLng>(() => pin ?? DEFAULT_CENTER, [pin]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLinkError(a.geolocationUnavailable);
      return;
    }
    setLocating(true);
    setLinkError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLinkError(a.geolocationDenied);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  function pasteLink(text: string) {
    if (!text.trim()) { setLinkError(null); return; }
    const parsed = parseMapUrl(text);
    if (parsed) {
      onChange(parsed);
      setLinkError(null);
    } else {
      setLinkError(a.noCoordsInLink);
    }
  }

  function setPart(part: 'lat' | 'lng', raw: string) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const next = { lat: pin?.lat ?? DEFAULT_CENTER.lat, lng: pin?.lng ?? DEFAULT_CENTER.lng, [part]: n };
    onChange(next as LatLng);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label ?? a.location}
        </Label>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" disabled={disabled || locating}
            onClick={useMyLocation}>
            {locating
              ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              : <Crosshair className="h-4 w-4 mr-1" />}
            {a.useMyLocation}
          </Button>
          {pin && (
            <Button type="button" size="sm" variant="ghost" disabled={disabled}
              onClick={() => onChange(null)}>
              <X className="h-4 w-4 mr-1" /> {a.clear}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-border" style={{ height }}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={pin ? 15 : 11}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter center={center} />
          {!disabled && <ClickToPlace onPick={onChange} />}
          {pin && (
            <Marker
              position={[pin.lat, pin.lng]}
              icon={pinIcon}
              draggable={!disabled}
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = (e.target as L.Marker).getLatLng();
                  onChange({ lat, lng });
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          type="number" step="0.00001" placeholder={a.latitude} disabled={disabled}
          value={pin?.lat ?? ''} onChange={(e) => setPart('lat', e.target.value)}
        />
        <Input
          type="number" step="0.00001" placeholder={a.longitude} disabled={disabled}
          value={pin?.lng ?? ''} onChange={(e) => setPart('lng', e.target.value)}
        />
      </div>

      <Input
        placeholder={a.pasteMapLink} disabled={disabled}
        onChange={(e) => pasteLink(e.target.value)}
      />

      {linkError && <p className="text-[11px] text-amber-600">{linkError}</p>}
      {hint && !linkError && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {!pin && !linkError && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {a.tapToPlace}
        </p>
      )}
    </div>
  );
};
