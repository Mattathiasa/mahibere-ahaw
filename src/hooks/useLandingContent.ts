import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  landingContentService,
  DEFAULT_LANDING_CONTENT,
  deepMerge,
  type LandingContent,
  type MultiLangLandingContent,
} from '@/services/landingContent';
import type { Language } from '@/i18n/translations';

interface UseLandingContentResult {
  content: LandingContent;
  loading: boolean;
}

// Module-level cache so we only fetch once per session
let cachedData: MultiLangLandingContent | null = null;
let fetchPromise: Promise<void> | null = null;

function ensureFetched(): Promise<void> {
  if (cachedData) return Promise.resolve();
  if (fetchPromise) return fetchPromise;
  // Don't leave visitors on the skeleton forever if Firestore is slow or
  // unreachable — fall back to defaults after 6s (late data still caches
  // for the next mount).
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 6000));
  const fetch = landingContentService
    .getAll()
    .then((data) => { cachedData = data; })
    .catch(() => { cachedData = {}; });
  fetchPromise = Promise.race([fetch, timeout]).then(() => {
    if (!cachedData) fetchPromise = null; // timed out — let a later mount retry
  });
  return fetchPromise;
}

export function invalidateLandingCache() {
  cachedData = null;
  fetchPromise = null;
}

function resolveContent(data: MultiLangLandingContent, lang: Language): LandingContent {
  const langData = data[lang];
  const fallback = DEFAULT_LANDING_CONTENT[lang] ?? DEFAULT_LANDING_CONTENT.en;

  if (!langData) return fallback;

  // Deep-merge: Firestore data wins where it exists, default fills gaps
  return deepMerge(
    fallback as unknown as Record<string, unknown>,
    langData as unknown as Record<string, unknown>
  ) as unknown as LandingContent;
}

export function useLandingContent(): UseLandingContentResult {
  const { language } = useLanguage();
  const [allData, setAllData] = useState<MultiLangLandingContent>(cachedData ?? {});
  const [loading, setLoading] = useState(!cachedData);

  useEffect(() => {
    let cancelled = false;
    ensureFetched().then(() => {
      if (!cancelled) {
        setAllData(cachedData ?? {});
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const content = resolveContent(allData, language);
  return { content, loading };
}
