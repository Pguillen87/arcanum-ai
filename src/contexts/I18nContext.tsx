import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Locale = 'pt-BR' | 'en';

interface I18nPrefs {
  locale: Locale;
  mystical: boolean;
  setLocale: (l: Locale) => void;
  setMystical: (m: boolean) => void;
}

const I18nContext = createContext<I18nPrefs | null>(null);

const LS_LOCALE = 'locale';
const LS_MYSTICAL = 'mysticalLanguage';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('pt-BR');
  const [mystical, setMysticalState] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedLocale = (localStorage.getItem(LS_LOCALE) as Locale) || (navigator.language.startsWith('en') ? 'en' : 'pt-BR');
      const storedMystical = localStorage.getItem(LS_MYSTICAL);
      setLocaleState(storedLocale);
      setMysticalState(storedMystical === null ? true : storedMystical === 'true');
    } catch {}
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem(LS_LOCALE, l); } catch {}
  };
  const setMystical = (m: boolean) => {
    setMysticalState(m);
    try { localStorage.setItem(LS_MYSTICAL, String(m)); } catch {}
  };

  const value = useMemo(() => ({ locale, mystical, setLocale, setMystical }), [locale, mystical]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

