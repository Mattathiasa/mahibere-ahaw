import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Language } from '@/i18n/translations';

/**
 * The home page photo gallery.
 *
 * Deliberately NOT part of `landingContent`. That document stores a complete
 * copy of the page per language, so the old `carousel` field meant uploading
 * the same photographs four times — and forgetting to left three languages
 * showing different pictures. Photographs are not language-specific; only their
 * captions are, so only the captions are keyed by language.
 *
 * Lives in `siteConfig`, which is already public-read and admin-write, so this
 * needs no rules change.
 */

export interface GalleryImage {
  url: string;
  /**
   * Cloudinary's identifier for the file. Every previous uploader threw this
   * away, which means the existing hero and carousel images can only ever be
   * dereferenced, never found again. Storing it keeps real deletion possible
   * later without re-uploading everything.
   */
  publicId: string;
  caption?: Partial<Record<Language, string>>;
}

export interface Gallery {
  images: GalleryImage[];
  meta?: { updatedAt?: string; updatedBy?: string };
}

export const EMPTY_GALLERY: Gallery = { images: [] };

const REF = () => doc(db, 'siteConfig', 'gallery');

function normalize(raw: unknown): Gallery {
  const data = raw as Partial<Gallery> | undefined;
  if (!data || !Array.isArray(data.images)) return EMPTY_GALLERY;
  return {
    images: data.images
      // A row with no URL renders as a broken image, so drop it on read rather
      // than trusting whatever is in the document.
      .filter((i): i is GalleryImage => !!i && typeof i.url === 'string' && i.url.length > 0)
      .map((i) => ({ url: i.url, publicId: i.publicId ?? '', caption: i.caption ?? {} })),
    meta: data.meta,
  };
}

export const galleryService = {
  async get(): Promise<Gallery> {
    try {
      const snap = await getDoc(REF());
      return snap.exists() ? normalize(snap.data()) : EMPTY_GALLERY;
    } catch {
      // The home page is public and must render regardless.
      return EMPTY_GALLERY;
    }
  },

  async save(gallery: Gallery, updatedBy: string): Promise<void> {
    await setDoc(REF(), {
      images: gallery.images,
      meta: { updatedAt: new Date().toISOString(), updatedBy },
    });
  },
};

/** The caption in the active language, falling back to English then anything. */
export function captionFor(image: GalleryImage, lang: Language): string {
  const c = image.caption;
  if (!c) return '';
  return c[lang]?.trim() || c.en?.trim() || Object.values(c).find((v) => v?.trim())?.trim() || '';
}
