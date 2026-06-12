import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Language } from '@/i18n/translations';

// A flat key→value map of string overrides per language
export type PageStringOverrides = Record<string, string>;
export type AllLanguageOverrides = Partial<Record<Language, PageStringOverrides>>;

const COLLECTION = 'siteConfig';
const DOCUMENT = 'pageStrings';

export const pageStringsService = {
  async get(): Promise<AllLanguageOverrides> {
    const ref = doc(db, COLLECTION, DOCUMENT);
    const snap = await getDoc(ref);
    if (!snap.exists()) return {};
    return snap.data() as AllLanguageOverrides;
  },

  async save(overrides: AllLanguageOverrides, updatedBy: string): Promise<void> {
    const ref = doc(db, COLLECTION, DOCUMENT);
    await setDoc(ref, { ...overrides, _meta: { updatedAt: new Date().toISOString(), updatedBy } });
  },
};
