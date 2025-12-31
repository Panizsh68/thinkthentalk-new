'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Language } from '@/lib/types';
import en from './en.json';
import fa from './fa.json';

type Translations = { [key: string]: string | Translations };

const translations: { [key in Language]: Translations } = {
  en,
  fa,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const storedLanguage = localStorage.getItem('language') as Language;
    if (storedLanguage && ['en', 'fa'].includes(storedLanguage)) {
      setLanguage(storedLanguage);
    } else {
      // Set default if nothing is stored
      setLanguage('en');
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    if (typeof window !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    }
  };

  const t = useCallback((key: string, options?: any): string => {
    const keys = key.split('.');
    let result: string | Translations | undefined = translations[language];
    for (const k of keys) {
      if (typeof result === 'object' && result !== null && k in result) {
        result = (result as Translations)[k];
      } else {
        // Fallback to English if key not found in current language
        let fallbackResult: string | Translations | undefined = translations['en'];
        for (const fk of keys) {
           if (typeof fallbackResult === 'object' && fallbackResult !== null && fk in fallbackResult) {
             fallbackResult = (fallbackResult as Translations)[fk];
           } else {
             return key; // Return key if not found in fallback either
           }
        }
        result = fallbackResult;
        break;
      }
    }
    
    let resultString = typeof result === 'string' ? result : key;

    if (options && typeof resultString === 'string') {
        Object.keys(options).forEach(optionKey => {
            resultString = resultString.replace(`{${optionKey}}`, String(options[optionKey]));
        });
    }

    return resultString;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
