import { useEffect, useState } from 'react';
import { motion as Motion, MotionConfig } from 'framer-motion';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import HomeCampaign from '../components/HomeCampaign';
import ProductCard from '../components/ProductCard';
import { listCatalogProducts } from '../api/catalog.api';
import { PRODUCT_CATEGORIES } from '../constants/productCategories';
import './Home.css';

const Home = () => {
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
        const results = await Promise.allSettled(
          PRODUCT_CATEGORIES.map(({ slug }) =>
            listCatalogProducts(slug, { page: 1, limit: 2 }),
          ),
        );
        if (!cancelled) {
          const items = results
            .filter((r) => r.status === 'fulfilled' && Array.isArray(r.value?.products))
            .flatMap((r) => r.value.products);
          const uniqueItems = new Map(items.map((product) => [
            `${product.categorySlug || product.category}-${product.id}`, product,
          ]));
          setFeatured([...uniqueItems.values()].slice(0, 8));
          setFeaturedError(results.some((result) => result.status === 'rejected')
            ? 'Some collections are unavailable right now. Please try again shortly.' : '');
        }
      } catch {
        if (!cancelled) {
          setFeatured([]);
          setFeaturedError('Collections are unavailable right now. Please try again shortly.');
        }
      } finally {
        if (!cancelled) setLoadingFeatured(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
        image="/ChatGPT Image Sep 7, 2026, 06_37_21 AM.png"
        imagePosition="center 35%"
        eyebrow="Discover the new collection"
        title="Ethereal radiance"
        href="/collections/necklaces"
        cta="Shop the collection"
      />

      <section className="home-editorial">
        <Motion.div className="home-editorial__image"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.8 }}>
          <img src="/shop_look.png" alt="Model wearing the Husan diamond solitaire ensemble" loading="lazy" />
        </Motion.div>
        <Motion.div className="home-editorial__copy"
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.8 }}>
          <p>The solitaire edit</p>
          <h2>A little brilliance. Every day.</h2>
          <p>Discover earrings and necklaces to wear together, or make a statement with a single piece.</p>
          <a className="home-editorial__cta" href="/collections/earrings">Shop the look</a>
        </Motion.div>
      </section>

      <HomeCampaign
        image="/gift_love.png"
        imagePosition="center 48%"
        eyebrow="A gift with meaning"
        title="Say it with love"
        href="/collections/necklaces"
        cta="Shop gifts"
      />
      {/* Each collection uses the same full-width animated campaign layout. */}
      {[
        { image: '/cat_gifts.png', title: 'Gifts for her', eyebrow: 'Curated expressions', href: '/collections/necklaces', cta: 'Shop gifts for her' },
        { image: '/cat_earrings.png', title: 'Earrings', eyebrow: 'Solitaires & drops', href: '/collections/earrings', cta: 'Shop earrings', imagePosition: 'center 40%' },
        { image: '/cat_bracelets.png', title: 'Bracelets', eyebrow: 'Tennis & bangles', href: '/collections/bracelets', cta: 'Shop bracelets' },
        { image: '/cat_newin.png', title: 'New in & rings', eyebrow: 'Latest creations', href: '/collections/rings', cta: 'Shop rings' },
      ].map((collection) => (
        <HomeCampaign key={collection.href} {...collection} />
      ))}

      {/* Redesigned Featured Pieces Section */}
      <section className="trending-section container">
        <div className="section-header">
          <div>
            <span className="section-eyebrow">Hand-Crafted Brilliance</span>
            <h2 className="section-title">Featured Pieces</h2>
          </div>
          <a href="/collections/necklaces" className="view-all-link">
            <span>View All Pieces</span>
            <ArrowRight size={14} />
          </a>
        </div>

        {loadingFeatured ? (
          <div className="home-featured-loading-wrap">
            <div className="cta-gold-spinner"></div>
            <p className="home-featured-loading">Loading curated pieces…</p>
          </div>
        ) : featured.length > 0 ? (
          <div className="products-grid">
            {featured.map((product) => (
              <ProductCard key={`${product.category}-${product.id}`} product={product} categorySlug={product.categorySlug} />
            ))}
          </div>
        ) : (
          <p className="home-featured-loading" role={featuredError ? 'alert' : undefined}>{featuredError || 'No products available yet.'}</p>
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
          <div className="newsletter-badge">
            <Sparkles size={14} className="newsletter-badge-icon" />
            <span>The Privilege Club · 10% Off First Acquisition</span>
          </div>

          <h2 className="newsletter-title">Join the Husan Society</h2>
          <p className="newsletter-desc">
            Receive private invitations to confidential high jewelry viewings, bespoke collection debuts, and complimentary concierge consultations.
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
              <h4>Welcome to the Husan Society</h4>
              <p>Your 10% privilege invitation code has been dispatched to your email address.</p>
            </Motion.div>
          ) : (
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                placeholder="Enter your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                className="newsletter-input"
              />
              <button type="submit" className="newsletter-submit-btn">
                <span>Join Society</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          <span className="newsletter-disclaimer">
            Complimentary membership. Unsubscribe at any time. Respect for your privacy is paramount.
          </span>
        </Motion.div>
      </section>
    </div>
    </MotionConfig>
  );
};

export default Home;
