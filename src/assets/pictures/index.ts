/**
 * Every photo in this directory, bundled and hashed by Vite.
 *
 * Globbed rather than listed by hand so that dropping a new image in here is
 * all it takes to use it — no code change, no import to remember. The home page
 * feeds these to the feature cards and the photo band.
 */
const files = import.meta.glob('./*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/** Sorted by filename, so the order on the page is stable across builds. */
export const PICTURES: string[] = Object.keys(files)
  .sort()
  .map((path) => files[path]);
