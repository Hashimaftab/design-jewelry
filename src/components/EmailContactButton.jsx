import { Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContextValue';
import './EmailContactButton.css';

const SUPPORT_EMAIL = 'orders@husnx.com';

const EmailContactButton = () => {
  const { t } = useLanguage();

  return (
    <a
      className="email-contact-button"
      href={`mailto:${SUPPORT_EMAIL}`}
      aria-label={t('contact.emailAria')}
      title={SUPPORT_EMAIL}
    >
      <Mail aria-hidden="true" size={20} strokeWidth={1.8} />
      <span>{t('contact.emailButton')}</span>
    </a>
  );
};

export default EmailContactButton;
