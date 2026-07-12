import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { listCatalogProducts } from '../api/catalog.api';
import { PRODUCT_CATEGORIES } from '../constants/productCategories';
import './Home.css';

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingFeatured(true);
      try {
        const results = await Promise.all(
          PRODUCT_CATEGORIES.map(({ slug }) =>
            listCatalogProducts(slug, { page: 1, limit: 2 }),
          ),
        );
        if (!cancelled) {
          setFeatured(results.flatMap((r) => r.products).slice(0, 8));
        }
      } catch {
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

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-bg" style={{ backgroundImage: `url('/hero_bg.png')` }}></div>
        <div className="hero-content">
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            Ethereal Radiance
          </motion.h1>
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
          >
            Discover the new era of timeless luxury.
          </motion.p>
          <motion.a
            href="/collections/necklaces"
            className="btn-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            Explore Collection
          </motion.a>
        </div>
      </section>

      <section className="shop-the-look container">
        <div className="stl-layout">
          <div className="stl-info">
            <h2 className="section-title">Shop The Look</h2>
            <p className="section-desc">
              A curated ensemble featuring our most brilliant diamond set. Perfect for unforgettable
              evenings.
            </p>
            <a href="/collections/earrings" className="btn-secondary">
              Shop All Sets
            </a>
          </div>
          <motion.div
            className="stl-image-container"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <img src="/shop_look.png" alt="Model wearing Husan jewelry" className="stl-image" />

            <motion.div className="hotspot hotspot-earring" whileHover={{ scale: 1.1 }}>
              <Plus size={16} />
              <div className="hotspot-tooltip">Brilliant Solitaire Studs</div>
            </motion.div>

            <motion.div className="hotspot hotspot-necklace" whileHover={{ scale: 1.1 }}>
              <Plus size={16} />
              <div className="hotspot-tooltip">Eternity Diamond Necklace</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="shop-categories container">
        <h2 className="section-title text-center" style={{ textAlign: 'center' }}>
          Shop by Category
        </h2>
        <div className="categories-grid">
          {[
            { img: '/cat_gifts.png', title: 'Gifts for her', link: '/collections/necklaces' },
            { img: '/cat_earrings.png', title: 'Earrings', link: '/collections/earrings' },
            { img: '/cat_bracelets.png', title: 'Bracelets', link: '/collections/bracelets' },
            { img: '/cat_newin.png', title: 'New In', link: '/collections/rings' },
          ].map((cat, index) => (
            <motion.a
              href={cat.link}
              key={index}
              className="category-card"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: index * 0.15, ease: 'easeOut' }}
            >
              <div className="cat-img-wrapper media-frame media-frame--category media-frame--cover">
                <img src={cat.img} alt={cat.title} />
              </div>
              <h3 className="cat-title">{cat.title}</h3>
            </motion.a>
          ))}
        </div>
      </section>

      <section className="trending-section container">
        <div className="section-header">
          <h2 className="section-title">Featured Pieces</h2>
          <a href="/collections/necklaces" className="view-all-link">
            View All
          </a>
        </div>

        {loadingFeatured ? (
          <p className="home-featured-loading">Loading featured pieces…</p>
        ) : (
          <div className="products-grid">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} categorySlug={product.categorySlug} />
            ))}
          </div>
        )}

        {!loadingFeatured && featured.length === 0 ? (
          <p className="home-featured-loading">No products available yet.</p>
        ) : null}
      </section>

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

      <section
        className="newsletter-section"
        style={{ backgroundImage: `url('/newsletter_bg.png')` }}
      >
        <motion.div
          className="newsletter-content"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2>Join the Husan Society</h2>
          <p>Subscribe to receive exclusive access to new collections and events.</p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email address" required />
            <button type="submit">Subscribe</button>
          </form>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
