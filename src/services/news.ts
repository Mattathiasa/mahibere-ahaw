import { db } from '@/lib/firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit as fsLimit, serverTimestamp,
} from 'firebase/firestore';
import { auditLogService } from '@/services/auditLog';
import type { Language } from '@/i18n/translations';

/**
 * Homepage news / blog.
 *
 * The document ID *is* the slug, so a detail page is a single getDoc with no
 * composite index and the `status == 'published'` rule evaluates cleanly on a
 * direct read.
 */

export type NewsStatus = 'draft' | 'published' | 'archived';
export type NewsScope = 'global' | 'atbiya';

/** Per-language text. `en` and `am` are the ones the UI falls back through. */
export type LocalizedText = Partial<Record<Language, string>>;

export interface NewsPost {
  id: string;
  slug: string;
  status: NewsStatus;
  publishedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  body: LocalizedText;
  coverImageUrl?: string;
  images?: string[];
  scope: NewsScope;
  atbiyaId: string | null;
  /** Denormalized so the homepage badge needs no join. */
  /**
   * Parish name per language. A partial record over every supported Language,
   * not the `{ en?, am? }` pair it used to be: NewsSection looks this up in the
   * reader's active language, so an Afaan Oromoo or Tigrinya name had nowhere to
   * live and indexing it was an implicit `any` the compiler was not checking.
   */
  atbiyaName: Partial<Record<Language, string>> | null;
  authorId: string;
  authorName: string;
  authorRole?: string;
  tags?: string[];
  featured?: boolean;
}

export type NewsInput = Omit<NewsPost, 'id'>;

/** First non-empty string, preferring the active language then English. */
export function pickText(text: LocalizedText | undefined, lang: Language): string {
  if (!text) return '';
  return text[lang]?.trim() || text.en?.trim() || text.am?.trim()
    || Object.values(text).find((v) => v?.trim())?.trim() || '';
}

/**
 * ASCII slug from the English title. Amharic-only posts have no usable ASCII
 * form, so they fall back to a timestamp rather than producing an empty id.
 */
export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || `post-${Date.now()}`;
}

const col = collection(db, 'news');

function fromSnap(id: string, data: Record<string, unknown>): NewsPost {
  return { id, ...(data as Omit<NewsPost, 'id'>) };
}

export const newsService = {
  /** Published posts, newest first. Readable by anonymous visitors. */
  async listPublished(options?: { max?: number; atbiyaId?: string }): Promise<NewsPost[]> {
    const clauses = [where('status', '==', 'published')];
    if (options?.atbiyaId) clauses.push(where('atbiyaId', '==', options.atbiyaId));
    const q = query(col, ...clauses, orderBy('publishedAt', 'desc'), fsLimit(options?.max ?? 24));
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromSnap(d.id, d.data()));
  },

  async getBySlug(slug: string): Promise<NewsPost | null> {
    const snap = await getDoc(doc(db, 'news', slug));
    return snap.exists() ? fromSnap(snap.id, snap.data()) : null;
  },

  /**
   * Everything an author may manage: their parish's posts, or all posts for a
   * head-office author. Sorted client-side so drafts (which have no
   * publishedAt) do not need their own index.
   */
  async listForAuthor(options: { isHeadOffice: boolean; atbiyaId?: string }): Promise<NewsPost[]> {
    const q = options.isHeadOffice || !options.atbiyaId
      ? query(col)
      : query(col, where('atbiyaId', '==', options.atbiyaId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => fromSnap(d.id, d.data()))
      .sort((a, b) => (b.updatedAt ?? b.createdAt ?? '').localeCompare(a.updatedAt ?? a.createdAt ?? ''));
  },

  /** Picks a free slug, appending -2, -3 … on collision. */
  async uniqueSlug(title: string): Promise<string> {
    const base = slugify(title);
    for (let i = 0; i < 25; i++) {
      const candidate = i === 0 ? base : `${base}-${i + 1}`;
      const existing = await getDoc(doc(db, 'news', candidate));
      if (!existing.exists()) return candidate;
    }
    return `${base}-${Date.now()}`;
  },

  async create(input: NewsInput): Promise<string> {
    const slug = await this.uniqueSlug(pickText(input.title, 'en') || pickText(input.title, 'am'));
    const payload: Omit<NewsPost, 'id'> = {
      ...input,
      slug,
      publishedAt: input.status === 'published' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'news', slug), payload);
    auditLogService.dataChange('create', 'news', slug, `Created news post "${pickText(input.title, 'en')}"`);
    return slug;
  },

  /** The slug is frozen after creation so published links never break. */
  async update(id: string, input: Partial<NewsInput>): Promise<void> {
    const patch: Record<string, unknown> = { ...input, updatedAt: new Date().toISOString() };
    delete patch.slug;
    await updateDoc(doc(db, 'news', id), patch);
    auditLogService.dataChange('update', 'news', id, `Updated news post ${id}`);
  },

  async setStatus(id: string, status: NewsStatus): Promise<void> {
    await updateDoc(doc(db, 'news', id), {
      status,
      // Stamp the publish time the first time it goes live; keep it thereafter
      // so re-publishing does not reorder the feed.
      ...(status === 'published' ? { publishedAt: new Date().toISOString() } : {}),
      updatedAt: new Date().toISOString(),
    });
    auditLogService.dataChange('update', 'news', id, `Set news post ${id} to ${status}`);
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, 'news', id));
    auditLogService.dataChange('delete', 'news', id, `Deleted news post ${id}`);
  },
};
