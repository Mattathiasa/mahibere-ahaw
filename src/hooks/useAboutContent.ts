import { useEffect, useState } from 'react';
import {
  aboutContentService,
  DEFAULT_ABOUT_CONTENT,
  type AboutContent,
  type MultiLangAboutContent,
} from '@/services/aboutContent';
import { deepMerge } from '@/services/landingContent';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * The /about page content for the active language.
 *
 * Same shape as useFeaturesContent and useLandingContent — a module-level
 * cache, one shared in-flight request, and a timeout so a slow or unreachable
 * Firestore falls back to the bundled defaults rather than leaving a public
 * page blank.
 */
let cached: MultiLangAboutContent | null = null;
let inFlight: Promise<MultiLangAboutContent> | null = null;

export function invalidateAboutCache() {
  cached = null;
  inFlight = null;
}

function load(): Promise<MultiLangAboutContent> {
  if (cached) return Promise.resolve(cached);
  if (!inFlight) {
    inFlight = Promise.race([
      aboutContentService.get(),
      new Promise<MultiLangAboutContent>((resolve) => setTimeout(() => resolve({}), 6000)),
    ])
      .then((data) => { cached = data; return data; })
      .catch(() => ({}))
      .finally(() => { inFlight = null; });
  }
  return inFlight;
}

export function useAboutContent() {
  const { language } = useLanguage();
  const [data, setData] = useState<MultiLangAboutContent>(cached ?? {});
  const [loaded, setLoaded] = useState(!!cached);

  useEffect(() => {
    let alive = true;
    load().then((d) => {
      if (!alive) return;
      setData(d);
      setLoaded(true);
    });
    return () => { alive = false; };
  }, []);

  const base = DEFAULT_ABOUT_CONTENT[language] ?? DEFAULT_ABOUT_CONTENT.am;
  const stored = data[language];
  // Arrays are replaced wholesale rather than merged elementwise, so an admin
  // who removes a subsection actually removes it.
  const content = (stored
    ? deepMerge(
        base as unknown as Record<string, unknown>,
        stored as unknown as Record<string, unknown>
      )
    : base) as AboutContent;

  return { content, loaded };
}
