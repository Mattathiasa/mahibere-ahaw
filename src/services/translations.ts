import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Translations } from '../i18n/translations';

const COLLECTION = 'siteConfig';
const DOCUMENT = 'translations_overrides';

export interface TranslationOverrides {
  en?: Partial<Translations>;
  am?: Partial<Translations>;
  om?: Partial<Translations>;
}

export const translationService = {
  async getOverrides(): Promise<TranslationOverrides> {
    try {
      const ref = doc(db, COLLECTION, DOCUMENT);
      const snap = await getDoc(ref);
      if (!snap.exists()) return {};
      return snap.data() as TranslationOverrides;
    } catch (error) {
      console.error('Error fetching translations overrides:', error);
      return {};
    }
  },

  async saveOverrides(overrides: TranslationOverrides): Promise<void> {
    const ref = doc(db, COLLECTION, DOCUMENT);
    await setDoc(ref, overrides);
  }
};

/**
 * Deep merge utility for translations
 */
export function deepMergeTranslations(base: any, overrides: any): any {
  const result = { ...base };
  
  if (!overrides) return result;

  for (const key in overrides) {
    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      if (
        overrides[key] &&
        typeof overrides[key] === 'object' &&
        !Array.isArray(overrides[key]) &&
        base[key] &&
        typeof base[key] === 'object'
      ) {
        result[key] = deepMergeTranslations(base[key], overrides[key]);
      } else {
        result[key] = overrides[key];
      }
    }
  }
  return result;
}
