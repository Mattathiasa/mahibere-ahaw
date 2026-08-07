import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations, Language } from '../i18n/translations';
import { pageStringsService, type PageStringOverrides } from '@/services/pageStrings';

/**
 * Build a flat key→string map from the nested translations object.
 *
 * Every string is registered twice: under its dotted path (`nav.plans`) and,
 * when no other section claimed it first, under its bare leaf (`plans`).
 *
 * The bare leaf exists only for callers written before dotted keys and is
 * genuinely ambiguous — the tree has both `nav.plans` and `pages.plans`, and
 * whichever section is walked first wins. Prefer the dotted form in new code.
 */
function buildFlatMap(lang: Language, overrides: PageStringOverrides = {}): Record<string, string> {
  const source = translations[lang] as Record<string, unknown>;
  const flat: Record<string, string> = {};

  for (const [section, value] of Object.entries(source)) {
    if (!value || typeof value !== 'object') continue;
    for (const [key, leaf] of Object.entries(value as Record<string, unknown>)) {
      if (typeof leaf !== 'string') continue;
      flat[`${section}.${key}`] = leaf;
      if (!(key in flat)) flat[key] = leaf;
    }
  }

  // Firestore overrides win over static translations. A dotted override also
  // updates the legacy bare alias, so `t('learnMore')` and `t('common.learnMore')`
  // cannot disagree.
  for (const [key, value] of Object.entries(overrides)) {
    if (key.startsWith('_') || !value?.trim()) continue;
    flat[key] = value;
    const leaf = key.includes('.') ? key.slice(key.indexOf('.') + 1) : null;
    if (leaf && flat[leaf] !== undefined) flat[leaf] = value;
  }

  return flat;
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
