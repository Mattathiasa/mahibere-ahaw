import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations, Language } from '../i18n/translations';
import { pageStringsService, type PageStringOverrides } from '@/services/pageStrings';

// ─── Build a flat key→string map from the nested translations object ──────────
function buildFlatMap(lang: Language, overrides: PageStringOverrides = {}): Record<string, string> {
  const source = translations[lang] as Record<string, unknown>;
  const flat: Record<string, string> = {};

  function walk(obj: Record<string, unknown>) {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'string') {
        if (!(key in flat)) flat[key] = val;
      } else if (val && typeof val === 'object') {
        walk(val as Record<string, unknown>);
      }
    }
  }

  walk(source);

  // Firestore overrides win over static translations
  return { ...flat, ...overrides };
}

// ─── Module-level cache so we only fetch once per session ─────────────────────
let cachedOverrides: Record<Language, PageStringOverrides> | null = null;
let fetchPromise: Promise<void> | null = null;

function ensureOverridesFetched(): Promise<void> {
  if (cachedOverrides) return Promise.resolve();
  if (fetchPromise) return fetchPromise;

  fetchPromise = pageStringsService
    .get()
    .then((data) => {
      cachedOverrides = (data ?? {}) as Record<Language, PageStringOverrides>;
    })
    .catch(() => {
      cachedOverrides = {} as Record<Language, PageStringOverrides>;
    });

  return fetchPromise;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useTranslation = () => {
  const { language } = useLanguage();
  const [overrides, setOverrides] = useState<PageStringOverrides>(
    cachedOverrides?.[language] ?? {}
  );

  useEffect(() => {
    ensureOverridesFetched().then(() => {
      setOverrides(cachedOverrides?.[language] ?? {});
    });
  }, [language]);

  const t = (key: string): string => {
    const flat = buildFlatMap(language, overrides);
    return flat[key] ?? key;
  };

  return { t, language };
};

// ─── Utility to force-refresh the cache (called after admin saves) ────────────
export function invalidateTranslationCache() {
  cachedOverrides = null;
  fetchPromise = null;
}
