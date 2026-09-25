import { useLanguage } from '../context/LanguageContextValue';
import './LanguageSwitcher.css';

export default function LanguageSwitcher({ floating = false }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className={`language-switcher${floating ? ' language-switcher--floating' : ''}`}
      role="group"
      aria-label={t('language.choose')}
    >
      <button
        type="button"
        className={language === 'nl' ? 'is-active' : ''}
        onClick={() => setLanguage('nl')}
        aria-pressed={language === 'nl'}
        title={t('language.dutch')}
      >
        NL
      </button>
      <span aria-hidden="true">/</span>
      <button
        type="button"
        className={language === 'en' ? 'is-active' : ''}
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        title={t('language.english')}
      >
        EN
      </button>
    </div>
  );
}

