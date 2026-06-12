import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations as localTranslations, Language, Translations } from '../i18n/translations';
import { translationService, deepMergeTranslations } from '@/services/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  refreshTranslations: () => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLangState] = useState<Language>('en');
  const [activeTranslations, setActiveTranslations] = useState(localTranslations);
  const [isLoading, setIsLoading] = useState(true);

  const loadTranslations = async () => {
    setIsLoading(true);
    const overrides = await translationService.getOverrides();
    
    const merged = {
      en: deepMergeTranslations(localTranslations.en, overrides.en),
      am: deepMergeTranslations(localTranslations.am, overrides.am),
      om: deepMergeTranslations(localTranslations.om, overrides.om),
      ti: deepMergeTranslations(localTranslations.ti, overrides.ti),
    };

    setActiveTranslations(merged);
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
