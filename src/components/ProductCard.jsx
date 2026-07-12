import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import './ProductCard.css';

const formatMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const ProductCard = ({ product, categorySlug }) => {
  const slug = categorySlug ?? product.categorySlug ?? product.category;
  const detailPath = `/collections/${slug}/${product.id}`;
  const imageSrc = product.imageUrl || product.image;

  return (
    <motion.article
      className="product-card"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Link to={detailPath} className="product-card__link">
        <div className="product-image-container media-frame media-frame--product">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name}
              loading="lazy"
              decoding="async"
            />
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
    </motion.article>
  );
};

export default ProductCard;
