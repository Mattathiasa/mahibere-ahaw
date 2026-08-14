// @vitest-environment node
// Pure maths, no DOM — same reason atbiyaRoles.test.ts pins node.
import { describe, expect, it } from 'vitest';
import {
  boundsOf, byDistanceFrom, formatDistance, hasCoords, haversineKm, parseMapUrl,
  splitByPinned,
} from '@/lib/geo';

const BOLE = { lat: 8.9950, lng: 38.7890 };
const MEGENAGNA = { lat: 9.0206, lng: 38.8000 };
const BISHOFTU = { lat: 8.7521, lng: 38.9789 };

describe('haversineKm', () => {
  it('is zero for the same point', () => {
    expect(haversineKm(BOLE, BOLE)).toBe(0);
  });

  it('matches known Addis distances within a tolerance', () => {
    // Bole → Megenagna is roughly 3 km; Bole → Bishoftu roughly 33 km.
    expect(haversineKm(BOLE, MEGENAGNA)).toBeGreaterThan(2);
    expect(haversineKm(BOLE, MEGENAGNA)).toBeLessThan(4);
    expect(haversineKm(BOLE, BISHOFTU)).toBeGreaterThan(28);
    expect(haversineKm(BOLE, BISHOFTU)).toBeLessThan(38);
  });

  it('is symmetric', () => {
    expect(haversineKm(BOLE, BISHOFTU)).toBeCloseTo(haversineKm(BISHOFTU, BOLE), 9);
  });
});

describe('formatDistance', () => {
  it('uses metres under a kilometre', () => {
    expect(formatDistance(0.34)).toBe('≈340 m');
  });

  it('uses one decimal under ten kilometres', () => {
    expect(formatDistance(2.44)).toBe('≈2.4 km');
  });

  it('rounds to whole kilometres beyond ten', () => {
    expect(formatDistance(33.4)).toBe('≈33 km');
  });
});

describe('hasCoords', () => {
  it('rejects missing, partial and out-of-range values', () => {
    expect(hasCoords(undefined)).toBe(false);
    expect(hasCoords({})).toBe(false);
    expect(hasCoords({ lat: 9 })).toBe(false);
    expect(hasCoords({ lat: 91, lng: 38 })).toBe(false);
    expect(hasCoords({ lat: 9, lng: 181 })).toBe(false);
    expect(hasCoords({ lat: NaN, lng: 38 })).toBe(false);
  });

  it('accepts a real pin, including zero', () => {
    expect(hasCoords(BOLE)).toBe(true);
    expect(hasCoords({ lat: 0, lng: 0 })).toBe(true);
  });
});

describe('parseMapUrl', () => {
  it('reads the /@lat,lng,zoom form', () => {
    expect(parseMapUrl('https://www.google.com/maps/@8.7521,38.9789,15z'))
      .toEqual({ lat: 8.7521, lng: 38.9789 });
  });

  it('reads a q= parameter', () => {
    expect(parseMapUrl('https://maps.google.com/?q=8.7521,38.9789'))
      .toEqual({ lat: 8.7521, lng: 38.9789 });
  });

  it('reads the !3d!4d share form', () => {
    expect(parseMapUrl('https://www.google.com/maps/place/X/data=!3m1!4b1!3d8.7521!4d38.9789'))
      .toEqual({ lat: 8.7521, lng: 38.9789 });
  });

  it('reads a bare "lat, lng" paste', () => {
    expect(parseMapUrl(' 8.7521, 38.9789 ')).toEqual({ lat: 8.7521, lng: 38.9789 });
  });

  it('returns null for a short link, which carries no coordinates', () => {
    expect(parseMapUrl('https://maps.app.goo.gl/abc123')).toBeNull();
  });

  it('returns null for blanks and nonsense', () => {
    expect(parseMapUrl('')).toBeNull();
    expect(parseMapUrl('   ')).toBeNull();
    expect(parseMapUrl('not a link')).toBeNull();
  });
});

describe('byDistanceFrom', () => {
  const groups = [
    { id: 'bishoftu', ...BISHOFTU },
    { id: 'unpinned' },
    { id: 'megenagna', ...MEGENAGNA },
  ];

  it('sorts nearest first', () => {
    const out = byDistanceFrom(BOLE, groups);
    expect(out[0].id).toBe('megenagna');
    expect(out[1].id).toBe('bishoftu');
  });

  it('keeps an unpinned group, sorted last with a null distance', () => {
    const out = byDistanceFrom(BOLE, groups);
    expect(out[out.length - 1].id).toBe('unpinned');
    expect(out[out.length - 1].km).toBeNull();
  });

  it('does not drop anything', () => {
    expect(byDistanceFrom(BOLE, groups)).toHaveLength(groups.length);
  });
});

describe('splitByPinned', () => {
  const items = [
    { id: 'pinned-a', ...BOLE },
    { id: 'unpinned' },
    { id: 'pinned-b', ...BISHOFTU },
    // A half-filled record is NOT a pin: hasCoords needs both numbers, and a
    // congregation with only a latitude would otherwise plot on the Greenwich
    // meridian, hundreds of kilometres out to sea.
    { id: 'half', lat: 9.01 },
  ];

  it('separates what can be plotted from what cannot', () => {
    const { pinned, unpinned } = splitByPinned(items);
    expect(pinned.map((p: any) => p.id)).toEqual(['pinned-a', 'pinned-b']);
    expect(unpinned.map((p: any) => p.id)).toEqual(['unpinned', 'half']);
  });

  it('loses nothing', () => {
    const { pinned, unpinned } = splitByPinned(items);
    expect(pinned.length + unpinned.length).toBe(items.length);
  });

  it('handles an empty list', () => {
    expect(splitByPinned([])).toEqual({ pinned: [], unpinned: [] });
  });
});

describe('boundsOf', () => {
  it('is null with nothing to enclose', () => {
    expect(boundsOf([])).toBeNull();
  });

  it('encloses every point', () => {
    const bounds = boundsOf([BOLE, MEGENAGNA, BISHOFTU]);
    expect(bounds).not.toBeNull();
    const [[south, west], [north, east]] = bounds!;
    // Bishoftu is the southernmost and easternmost; Megenagna the northernmost.
    expect(south).toBe(BISHOFTU.lat);
    expect(north).toBe(MEGENAGNA.lat);
    expect(west).toBe(BOLE.lng);
    expect(east).toBe(BISHOFTU.lng);
  });

  it('gives a zero-area box for one point', () => {
    // Which is why ChurchMapCanvas treats a single point as a setView rather
    // than a fitBounds — Leaflet renders a zero-area box at maximum zoom.
    const [[south, west], [north, east]] = boundsOf([BOLE])!;
    expect(south).toBe(north);
    expect(west).toBe(east);
  });
});
