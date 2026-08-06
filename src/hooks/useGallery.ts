import { useEffect, useState } from 'react';
import { galleryService, EMPTY_GALLERY, type Gallery } from '@/services/gallery';

/**
 * The gallery, fetched once per session.
 *
 * Same shape as useLandingContent: a module-level cache and a shared in-flight
 * promise, so several components on the home page cannot each trigger a read.
 */
let cached: Gallery | null = null;
let inFlight: Promise<Gallery> | null = null;

export function invalidateGalleryCache() {
  cached = null;
  inFlight = null;
}

function load(): Promise<Gallery> {
  if (cached) return Promise.resolve(cached);
  if (!inFlight) {
    inFlight = galleryService.get()
      .then((g) => { cached = g; return g; })
      .catch(() => EMPTY_GALLERY)
      .finally(() => { inFlight = null; });
  }
  return inFlight;
}

export function useGallery() {
  const [gallery, setGallery] = useState<Gallery>(cached ?? EMPTY_GALLERY);
  const [loaded, setLoaded] = useState(!!cached);

  useEffect(() => {
    let cancelled = false;
    load().then((g) => {
      if (cancelled) return;
      setGallery(g);
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  return { gallery, loaded };
}
