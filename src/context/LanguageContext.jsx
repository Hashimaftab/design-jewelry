import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, translations } from '../i18n/translations';
import { LanguageContext } from './LanguageContextValue';

const STORAGE_KEY = 'husan_storefront_language';

function getInitialLanguage() {
  const redirectLanguage = new URLSearchParams(window.location.search).get('lang');
  if (SUPPORTED_LANGUAGES.includes(redirectLanguage)) {
    try { localStorage.setItem(STORAGE_KEY, redirectLanguage); } catch { /* Use the redirect language without storage. */ }
    return redirectLanguage;
  }
  let saved;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* Storage can be unavailable in private browsing. */ }
  return SUPPORTED_LANGUAGES.includes(saved) ? saved : DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = useCallback((nextLanguage) => {
    if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) return;
    setLanguageState(nextLanguage);
    try { localStorage.setItem(STORAGE_KEY, nextLanguage); } catch { /* Keep the current session usable. */ }
    const url = new URL(window.location.href);
    if (url.searchParams.has('lang')) {
      url.searchParams.set('lang', nextLanguage);
      window.history.replaceState(window.history.state, '', url);
    }
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

