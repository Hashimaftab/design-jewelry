import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { legalPolicies } from '../content/legalPolicies';
import { useLanguage } from '../context/LanguageContextValue';
import './LegalPage.css';

export default function LegalPage({ policy }) {
  const { language, t } = useLanguage();
  const content = legalPolicies[language]?.[policy] ?? legalPolicies.en[policy];

  useEffect(() => {
    if (!content) return undefined;
    const previousTitle = document.title;
    document.title = `${content.title} | HUSN`;
    window.scrollTo({ top: 0, behavior: 'instant' });
    return () => { document.title = previousTitle; };
  }, [content]);

  if (!content) return <Navigate to="/" replace />;

  return (
    <div className="legal-page">
      <header className="legal-hero">
        <div className="container legal-hero__inner">
          <p className="legal-hero__eyebrow">{content.eyebrow}</p>
          <h1>{content.title}</h1>
          <p>{t('legal.husnCompany')}</p>
        </div>
      </header>

      <article className="container legal-content">
        <section className="legal-intro">
          <h2>{content.introTitle}</h2>
          {content.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>

        {content.sections.map((section) => (
          <section className="legal-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.intro ? <p>{section.intro}</p> : null}
            {section.bullets ? (
              <ul>
                {section.bullets.map((item) => (
                  <li key={`${item.label ?? ''}-${item.text}`}>
                    {item.label ? <strong>{item.label}: </strong> : null}
                    {item.text}
                  </li>
                ))}
              </ul>
            ) : null}
            {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.contact ? (
              <address className="legal-contact">
                <strong>HUSN BV</strong>
                <span>{t('legal.website')}: <a href="https://www.husnx.com">husnx.com</a></span>
                <span>{t('legal.email')}: <a href="mailto:hello@husnx.com">hello@husnx.com</a></span>
              </address>
            ) : null}
          </section>
        ))}
      </article>
    </div>
  );
}

