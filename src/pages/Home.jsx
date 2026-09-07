import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Check, Eye, ShoppingBag } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { listCatalogProducts } from '../api/catalog.api';
import { PRODUCT_CATEGORIES } from '../constants/productCategories';
import './Home.css';

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState(null);

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
          setFeatured(items.slice(0, 8));
        }
      } catch (err) {
        console.error('Failed to load featured products from backend:', err);
        if (!cancelled) setFeatured([]);
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
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div
          className="hero-bg"
          style={{ backgroundImage: `url('/ChatGPT Image Sep 7, 2026, 06_37_21 AM.png')` }}
        ></div>
        <div className="container hero-content-container">
          <div className="hero-content">
            <motion.p
              className="hero-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              Discover the new era of timeless luxury.
            </motion.p>
            <motion.h1
              className="hero-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
            >
              Ethereal Radiance
            </motion.h1>
            <motion.a
              href="/collections/necklaces"
              className="hero-cta-btn"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            >
              Explore Collection
            </motion.a>
          </div>
        </div>
      </section>

      {/* Redesigned Editorial "Shop The Look" */}
      <section className="shop-the-look container">
        <div className="stl-layout">
          <motion.div
            className="stl-info"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="stl-eyebrow">
              <Sparkles size={14} className="stl-eyebrow-icon" />
              <span>Curated Edit · Ensemble 01</span>
            </div>
            <h2 className="stl-title">The Diamond Solitaire Look</h2>
            <p className="stl-desc">
              An exquisite pairing of hand-selected round brilliant cut diamonds set in 18k white gold.
              Tailored for memorable evenings and red-carpet moments.
            </p>

            {/* Ensemble Featured Pieces List */}
            <div className="stl-pieces-list">
              <a href="/collections/earrings" className="stl-piece-item">
                <div className="stl-piece-thumb">
                  <img src="/earrings.png" alt="Brilliant Solitaire Studs" />
                </div>
                <div className="stl-piece-details">
                  <span className="stl-piece-name">Brilliant Solitaire Studs</span>
                  <span className="stl-piece-spec">1.50 ctw · 18k White Gold</span>
                </div>
                <span className="stl-piece-price">$1,450</span>
              </a>

              <a href="/collections/necklaces" className="stl-piece-item">
                <div className="stl-piece-thumb">
                  <img src="/necklace.png" alt="Eternity Tennis Necklace" />
                </div>
                <div className="stl-piece-details">
                  <span className="stl-piece-name">Eternity Tennis Necklace</span>
                  <span className="stl-piece-spec">5.20 ctw · Handcrafted</span>
                </div>
                <span className="stl-piece-price">$4,850</span>
              </a>
            </div>

            <div className="stl-actions">
              <a href="/collections/earrings" className="stl-cta-btn">
                <span>Shop Complete Ensemble</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </motion.div>

          <motion.div
            className="stl-image-container"
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <img src="/shop_look.png" alt="Model wearing Husan jewelry ensemble" className="stl-image" />
            <div className="stl-image-badge">
              <span>Haute Joaillerie · 2026 Collection</span>
            </div>

            {/* Hotspot 1: Earring Stud (Correctly Placed on Ear Stud) */}
            <div
              className={`hotspot hotspot-earring ${activeHotspot === 'earring' ? 'is-active' : ''}`}
              onMouseEnter={() => setActiveHotspot('earring')}
              onMouseLeave={() => setActiveHotspot(null)}
              onClick={() => setActiveHotspot(activeHotspot === 'earring' ? null : 'earring')}
            >
              <div className="hotspot-pulse"></div>
              <div className="hotspot-core">
                <Sparkles size={12} />
              </div>
              <div className="hotspot-card">
                <div className="hotspot-card-thumb">
                  <img src="/earrings.png" alt="Solitaire Studs" />
                </div>
                <div className="hotspot-card-info">
                  <span className="hotspot-card-cat">Earrings</span>
                  <h4 className="hotspot-card-title">Brilliant Solitaire Studs</h4>
                  <span className="hotspot-card-price">$1,450</span>
                  <a href="/collections/earrings" className="hotspot-card-link">
                    Shop Piece <ArrowRight size={12} />
                  </a>
                </div>
              </div>
            </div>

            {/* Hotspot 2: Tennis Necklace (Correctly Placed on Necklace) */}
            <div
              className={`hotspot hotspot-necklace ${activeHotspot === 'necklace' ? 'is-active' : ''}`}
              onMouseEnter={() => setActiveHotspot('necklace')}
              onMouseLeave={() => setActiveHotspot(null)}
              onClick={() => setActiveHotspot(activeHotspot === 'necklace' ? null : 'necklace')}
            >
              <div className="hotspot-pulse"></div>
              <div className="hotspot-core">
                <Sparkles size={12} />
              </div>
              <div className="hotspot-card">
                <div className="hotspot-card-thumb">
                  <img src="/necklace.png" alt="Eternity Necklace" />
                </div>
                <div className="hotspot-card-info">
                  <span className="hotspot-card-cat">Necklaces</span>
                  <h4 className="hotspot-card-title">Eternity Tennis Necklace</h4>
                  <span className="hotspot-card-price">$4,850</span>
                  <a href="/collections/necklaces" className="hotspot-card-link">
                    Shop Piece <ArrowRight size={12} />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Redesigned Shop by Category */}
      <section className="shop-categories container">
        <div className="section-title-wrap text-center">
          <span className="section-eyebrow">Timeless Creations</span>
          <h2 className="section-title">Shop by Category</h2>
          <div className="gold-title-divider"></div>
        </div>

        <div className="categories-grid">
          {[
            { img: '/cat_gifts.png', title: 'Gifts For Her', subtitle: 'Curated Expressions', num: '01', link: '/collections/necklaces' },
            { img: '/cat_earrings.png', title: 'Earrings', subtitle: 'Solitaires & Drops', num: '02', link: '/collections/earrings' },
            { img: '/cat_bracelets.png', title: 'Bracelets', subtitle: 'Tennis & Bangles', num: '03', link: '/collections/bracelets' },
            { img: '/cat_newin.png', title: 'New In & Rings', subtitle: 'Latest Creations', num: '04', link: '/collections/rings' },
          ].map((cat, index) => (
            <motion.a
              href={cat.link}
              key={index}
              className="category-card"
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: index * 0.12, ease: 'easeOut' }}
            >
              <div className="cat-img-wrapper">
                <img src={cat.img} alt={cat.title} />
                <span className="cat-number-badge">{cat.num}</span>
                <div className="cat-overlay-glow"></div>
              </div>
              <div className="cat-content">
                <span className="cat-subtitle">{cat.subtitle}</span>
                <h3 className="cat-title">{cat.title}</h3>
                <span className="cat-explore-btn">
                  <span>Explore Collection</span>
                  <ArrowRight size={14} className="cat-arrow-icon" />
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </section>

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
              <ProductCard key={product.id} product={product} categorySlug={product.categorySlug} />
            ))}
          </div>
        ) : (
          <p className="home-featured-loading">No products available yet.</p>
        )}
      </section>

      {/* Gift Love Editorial Banner */}
      <section className="gift-love-section">
        <div className="gift-layout">
          <motion.div
            className="gift-image-wrapper"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <img src="/gift_love.png" alt="Husan Created Diamonds" />
          </motion.div>
          <motion.div
            className="gift-content"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="gift-subtitle">GIFT LOVE</span>
            <h2 className="gift-title">HUSAN Created Diamonds</h2>
            <p className="gift-desc">
              Say yes to the season of love with HUSAN Created Diamonds and gift heart-cut laboratory
              grown diamonds. Set in precious metal, each beautifully crafted piece is cut for brilliance.
            </p>
            <div className="gift-links">
              <a href="/collections/necklaces">Shop now</a>
              <a href="/collections/rings">Gift Finder</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Redesigned Frosted Luxury Newsletter */}
      <section
        className="newsletter-section"
        style={{ backgroundImage: `url('/newsletter_bg.png')` }}
      >
        <motion.div
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
            <motion.div
              className="newsletter-success-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="newsletter-success-icon">
                <Check size={24} />
              </div>
              <h4>Welcome to the Husan Society</h4>
              <p>Your 10% privilege invitation code has been dispatched to your email address.</p>
            </motion.div>
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
        </motion.div>
      </section>
    </div>
  );
};

export default Home;

