import { useEffect, useState } from 'react';
import {
  featuresContentService,
  DEFAULT_FEATURES_CONTENT,
  type FeaturesContent,
  type MultiLangFeaturesContent,
} from '@/services/featuresContent';
import { deepMerge } from '@/services/landingContent';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * The /features page content for the active language.
 *
 * Same shape as useLandingContent — a module-level cache, one shared in-flight
 * request, and a timeout so a slow or unreachable Firestore falls back to the
 * bundled defaults instead of leaving a public page blank.
 */
let cached: MultiLangFeaturesContent | null = null;
let inFlight: Promise<MultiLangFeaturesContent> | null = null;

export function invalidateFeaturesCache() {
  cached = null;
  inFlight = null;
}

function load(): Promise<MultiLangFeaturesContent> {
  if (cached) return Promise.resolve(cached);
  if (!inFlight) {
    inFlight = Promise.race([
      featuresContentService.getAll(),
      new Promise<MultiLangFeaturesContent>((resolve) => setTimeout(() => resolve({}), 6000)),
    ])
      .then((data) => { cached = data; return data; })
      .catch(() => ({}))
      .finally(() => { inFlight = null; });
  }
  return inFlight;
}

function resolve(data: MultiLangFeaturesContent, lang: string): FeaturesContent {
  const fallback = DEFAULT_FEATURES_CONTENT[lang as keyof typeof DEFAULT_FEATURES_CONTENT]
    ?? DEFAULT_FEATURES_CONTENT.en;
  const override = data[lang as keyof MultiLangFeaturesContent] as FeaturesContent | undefined;
  if (!override) return fallback;
  return deepMerge(
    fallback as unknown as Record<string, unknown>,
    override as unknown as Record<string, unknown>
  ) as unknown as FeaturesContent;
}

export function useFeaturesContent() {
  const { language } = useLanguage();
  const [data, setData] = useState<MultiLangFeaturesContent>(cached ?? {});
  const [loaded, setLoaded] = useState(!!cached);

  useEffect(() => {
    let cancelled = false;
    load().then((d) => {
      if (cancelled) return;
      setData(d);
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  return { content: resolve(data, language), loaded };
}
