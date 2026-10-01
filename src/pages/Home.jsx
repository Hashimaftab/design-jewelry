import { useEffect, useState } from 'react';
import { motion as Motion, MotionConfig } from 'framer-motion';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import HomeCampaign from '../components/HomeCampaign';
import ProductCard from '../components/ProductCard';
import { listAllCatalogProducts } from '../api/catalog.api';
import { useLanguage } from '../context/LanguageContextValue';
import './Home.css';

const Home = () => {
  const { t } = useLanguage();
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [featuredError, setFeaturedError] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingFeatured(true);
      try {
        const result = await listAllCatalogProducts({ page: 1, limit: 8 });
        if (!cancelled) {
          setFeatured(result.products);
          setFeaturedError('');
        }
      } catch {
        if (!cancelled) {
          setFeatured([]);
          setFeaturedError(t('home.collectionsUnavailable'));
        }
      } finally {
        if (!cancelled) setLoadingFeatured(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSuccess(true);
      setTimeout(() => {
        setNewsletterEmail('');
      }, 4000);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
    <div className="home-page home-campaigns">
      <HomeCampaign
        hero
        video="/gemini_generated_video_f8b0a999.mp4"
        videoMobile="/gemini_generated_video_0d780065.mp4"
        imagePosition="60% 45%"
        eyebrow={t('home.heroEyebrow')}
        title={t('home.heroTitle')}
        href="/collections/necklaces"
        cta={t('home.shopCollection')}
      />

      <section className="home-editorial">
        <Motion.div className="home-editorial__image"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.8 }}>
          <img src="/WhatsApp Image 2026-09-29 at 11.36.18 PM.jpeg" alt={t('home.editorialAlt')} loading="lazy" />
        </Motion.div>
        <Motion.div className="home-editorial__copy"
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.8 }}>
          <p>{t('home.solitaireEdit')}</p>
          <h2>{t('home.brillianceTitle')}</h2>
          <p>{t('home.brillianceText')}</p>
          <a className="home-editorial__cta" href="/collections/earrings">{t('home.shopLook')}</a>
        </Motion.div>
      </section>

      <section className="home-editorial-video">
        <video
          src="/gemini_generated_video_320ff75b.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="home-editorial-video__player"
        />
      </section>

      {/* Redesigned Featured Pieces Section */}
      <section className="trending-section container">
        <div className="section-header">
          <div>
            <span className="section-eyebrow">{t('home.featuredEyebrow')}</span>
            <h2 className="section-title">{t('home.featuredTitle')}</h2>
          </div>
          <a href="/collections/all" className="view-all-link">
            <span>{t('home.viewAll')}</span>
            <ArrowRight size={14} />
          </a>
        </div>

        {loadingFeatured ? (
          <div className="home-featured-loading-wrap">
            <div className="cta-gold-spinner"></div>
            <p className="home-featured-loading">{t('home.loadingPieces')}</p>
          </div>
        ) : featured.length > 0 ? (
          <div className="products-grid">
            {featured.map((product) => (
              <ProductCard key={`${product.category}-${product.id}`} product={product} categorySlug={product.categorySlug} />
            ))}
          </div>
        ) : (
          <p className="home-featured-loading" role={featuredError ? 'alert' : undefined}>{featuredError || t('home.noProducts')}</p>
        )}
      </section>

      {/* Redesigned Frosted Luxury Newsletter */}
      <section
        className="newsletter-section"
        style={{ backgroundImage: `url('/newsletter_bg.png')` }}
      >
        <Motion.div
          className="newsletter-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="newsletter-title">{t('home.societyTitle')}</h2>
          <p className="newsletter-desc">
            {t('home.societyText')}
          </p>

          {newsletterSuccess ? (
            <Motion.div
              className="newsletter-success-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="newsletter-success-icon">
                <Check size={24} />
              </div>
              <h4>{t('home.welcomeSociety')}</h4>
              <p>{t('home.invitationSent')}</p>
            </Motion.div>
          ) : (
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                placeholder={t('home.emailPlaceholder')}
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                className="newsletter-input"
              />
              <button type="submit" className="newsletter-submit-btn">
                <span>{t('home.joinSociety')}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          <span className="newsletter-disclaimer">
            {t('home.newsletterDisclaimer')}
          </span>
        </Motion.div>
      </section>
    </div>
    </MotionConfig>
  );
};

export default Home;
