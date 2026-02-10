import { createContext, useContext, useState, useEffect } from 'react';
import { translations, MONTHS_FULL, MONTHS_SHORT } from '../i18n/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key) => translations[lang][key] || key;
  const monthsFull = MONTHS_FULL[lang];
  const monthsShort = MONTHS_SHORT[lang];
  const isRtl = lang === 'ar';

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'ar' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, monthsFull, monthsShort, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLang must be used within a LanguageProvider');
  }
  return context;
}
