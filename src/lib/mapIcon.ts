import L from 'leaflet';

/**
 * Leaflet marker icons, built as inline-SVG divIcons.
 *
 * Leaflet's default marker is loaded by URL relative to its CSS, which a bundler
 * rewrites and breaks — the classic "my markers are invisible" bug. An inline SVG
 * divIcon sidesteps it entirely and needs no image assets at any URL.
 *
 * That fix lived inside LocationPicker as a single hardcoded pin. It moved here
 * once a second map needed markers in more than one colour, so the lesson is
 * recorded in one place rather than half-remembered at the next call site.
 */

export interface PinOptions {
  /** Fill colour. Defaults to the app's primary blue. */
  color?: string;
  /** Pixel size of the square icon box. */
  size?: number;
  /** Draws a wider halo, for the currently selected marker. */
  highlighted?: boolean;
}

/** A teardrop pin with a white centre dot. */
export function makePinIcon({
  color = '#2E5E99',
  size = 28,
  highlighted = false,
}: PinOptions = {}): L.DivIcon {
  const halo = highlighted
    ? 'drop-shadow(0 0 6px rgba(46,94,153,.9)) drop-shadow(0 2px 3px rgba(0,0,0,.4))'
    : 'drop-shadow(0 2px 3px rgba(0,0,0,.4))';

  return L.divIcon({
    className: '',
    html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}"
             stroke="white" stroke-width="1.5" style="filter: ${halo}">
             <path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11z"/>
             <circle cx="12" cy="10" r="2.5" fill="white" stroke="none"/>
           </svg>`,
    iconSize: [size, size],
    // The tip of the teardrop, not its centre — otherwise the pin floats above
    // the place it is marking.
    iconAnchor: [size / 2, size - 2],
    popupAnchor: [0, -(size - 4)],
  });
}

/**
 * Marker colours by what is being shown.
 *
 * Ordered by rank in the structure, and paired with sizes at the call site so a
 * reader can tell the levels apart at a glance without consulting the legend:
 * the head office is the largest and darkest mark on the map, a Mahedher the
 * smallest and lightest.
 */
export const PIN_COLORS = {
  /** The head office (ጠቅላይ ጽሕፈት ቤት). One of these exists. */
  teklay: '#0D2440',
  /** A diocese (ሀገረ ስብከት), pinned by someone. */
  zone: '#40A8B1',
  /**
   * A diocese with no pin of its own, drawn at the centre of its congregations.
   * Deliberately a different colour rather than a different size: an estimate
   * must not be mistakable for a surveyed position at any zoom.
   */
  zoneApprox: '#9BC9CE',
  /** A congregation. */
  atbiya: '#2E5E99',
  /** A Mahedher (small group) — lighter, so the two layers read apart. */
  mahder: '#7BA4D0',
  /** The parish currently being placed. */
  selected: '#E0A200',
} as const;
