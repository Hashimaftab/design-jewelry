import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, translations } from '../i18n/translations';
import { LanguageContext } from './LanguageContextValue';

const STORAGE_KEY = 'husan_storefront_language';

function getInitialLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return SUPPORTED_LANGUAGES.includes(saved) ? saved : DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = useCallback((nextLanguage) => {
    if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) return;
    setLanguageState(nextLanguage);
    localStorage.setItem(STORAGE_KEY, nextLanguage);
  }, []);

  const t = useCallback((key, variables = {}) => {
    const template = translations[language]?.[key] ?? translations.en[key] ?? key;
    return Object.entries(variables).reduce(
      (value, [name, replacement]) => value.replaceAll(`{{${name}}}`, String(replacement)),
      template,
    );
  }, [language]);

  const value = useMemo(() => ({
    language,
    locale: language === 'nl' ? 'nl-NL' : 'en-GB',
    setLanguage,
    t,
  }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

