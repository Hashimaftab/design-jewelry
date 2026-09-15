import { formatStorePrice as formatMoney } from '../utils/currency';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import './ProductCard.css';


const ProductCard = ({ product, categorySlug }) => {
  const slug = categorySlug ?? product.categorySlug ?? product.category;
  const detailPath = `/collections/${slug}/${product.id}`;

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : (product.imageUrl || product.image ? [product.imageUrl || product.image] : []);

  const primaryImage = images[0] || null;
  const secondaryImage = images[1] || null;

  return (
    <Motion.article
      className="product-card"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Link to={detailPath} className="product-card__link">
        <div
          className={`product-image-container media-frame media-frame--product ${
            secondaryImage ? 'has-hover-image' : ''
          }`}
        >
          {primaryImage ? (
            <div className="product-card__image-stack">
              <img
                src={primaryImage}
                alt={product.name}
                className="product-card__img product-card__img--primary"
                loading="lazy"
                decoding="async"
              />
              {secondaryImage && (
                <img
                  src={secondaryImage}
                  alt={`${product.name} alternate view`}
                  className="product-card__img product-card__img--secondary"
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>
          ) : (
            <div className="media-frame__placeholder" aria-hidden />
          )}
          {!product.inStock ? (
            <span className="product-card__badge product-card__badge--out">Out of stock</span>
          ) : product.quantity <= 3 ? (
            <span className="product-card__badge">Only {product.quantity} left</span>
          ) : null}
          <div className="quick-add-container">
            <span className="quick-add-btn">
              <span>View details</span>
              <Plus size={16} />
            </span>
          </div>
        </div>
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-price">{formatMoney(product.price)}</p>
        </div>
      </Link>
    </Motion.article>
  );
};

export default ProductCard;
