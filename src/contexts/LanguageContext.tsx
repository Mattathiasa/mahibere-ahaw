import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations as localTranslations, Language, Translations } from '../i18n/translations';
import {
  translationService,
  deepMergeTranslations,
  type TranslationOverrides,
} from '@/services/translations';
import {
  pageStringsService,
  applyStringOverrides,
  type AllLanguageOverrides,
} from '@/services/pageStrings';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  refreshTranslations: () => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Assemble one language's strings, in order of increasing authority:
 *
 *   1. English            — the base, so no key can ever be missing
 *   2. the language itself
 *   3. siteConfig/translations_overrides   (Settings)
 *   4. siteConfig/pageStrings              (Landing Editor -> UI Translations)
 *
 * Step 1 matters: `pages` holds 233 keys in English but only 71 in Amharic,
 * Afaan Oromoo and Tigrinya, so without a base those three rendered
 * `undefined` for the other 162. Showing the English string is the honest
 * fallback — inventing translations in source would put words in the church's
 * mouth that nobody reviewed — and every fallback is listed in the UI
 * Translations tab for an admin to translate properly.
 *
 * Step 4 used to be missing entirely, which meant editing a string in the UI
 * Translations tab had no effect on anything rendered through `t`, including
 * the whole landing page.
 */
function buildLanguage(
  lang: Language,
  overrides: TranslationOverrides,
  pageStrings: AllLanguageOverrides
): Translations {
  const base = deepMergeTranslations(localTranslations.en, localTranslations[lang]);
  return applyStringOverrides(
    deepMergeTranslations(base, overrides[lang]),
    pageStrings[lang]
  ) as Translations;
}

function buildAll(
  overrides: TranslationOverrides,
  pageStrings: AllLanguageOverrides
): Record<Language, Translations> {
  return {
    en: buildLanguage('en', overrides, pageStrings),
    am: buildLanguage('am', overrides, pageStrings),
    om: buildLanguage('om', overrides, pageStrings),
    ti: buildLanguage('ti', overrides, pageStrings),
  };
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLangState] = useState<Language>('en');
  const [activeTranslations, setActiveTranslations] = useState<Record<Language, Translations>>(
    () => buildAll({}, {})
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadTranslations = async () => {
    setIsLoading(true);
    const [overrides, pageStrings] = await Promise.all([
      translationService.getOverrides(),
      pageStringsService.get().catch(() => ({} as AllLanguageOverrides)),
    ]);
    setActiveTranslations(buildAll(overrides, pageStrings));
    setIsLoading(false);
  };

  useEffect(() => {
    // 1. Load overrides from Firestore
    loadTranslations();

    // 2. Initial language from localStorage
    const stored = localStorage.getItem('app-language') as Language;
    if (stored && localTranslations[stored]) {
      setLangState(stored);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    if (localTranslations[lang]) {
      setLangState(lang);
      localStorage.setItem('app-language', lang);
    }
  };

  const refreshTranslations = async () => {
    await loadTranslations();
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t: activeTranslations[language], 
      refreshTranslations,
      isLoading 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
