/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Language, Translations, getTranslations, interpolate, LANGUAGES } from '@/shared/utils/i18n';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  interpolate: (text: string, vars: Record<string, string | number>) => string;
  languages: typeof LANGUAGES;
  currentLanguageCode: string;  // Added for compatibility
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'prompter-language';

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const normalizedSaved = saved.toLowerCase();
        if (LANGUAGES.some(l => l.code === normalizedSaved)) {
          return normalizedSaved as Language;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    
    try {
      const browserLang = navigator.language.split('-')[0].toLowerCase();
      if (LANGUAGES.some(l => l.code === browserLang)) {
        return browserLang as Language;
      }
    } catch {
      // Ignore detection errors
    }
    
    return 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    const normalizedLang = (lang as string).toLowerCase() as Language;
    setLanguageState(normalizedLang);
    try {
      localStorage.setItem(STORAGE_KEY, normalizedLang);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const translations = getTranslations(language);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations,
    interpolate,
    languages: LANGUAGES,
    currentLanguageCode: language,  // Added for compatibility
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}