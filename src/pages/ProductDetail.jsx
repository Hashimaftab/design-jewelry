import { formatStorePrice as formatMoney } from '../utils/currency';
import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { getCatalogProduct } from '../api/catalog.api';
import { isValidCategory } from '../constants/productCategories';

import { useCart } from '../context/CartContextValue';
import { getApiErrorMessage } from '../utils/adminAuth';
import { useLanguage } from '../context/LanguageContextValue';
import { getCurrentProductPrice } from '../utils/productHelpers';


const ProductDetail = () => {
  const { t, locale } = useLanguage();
  const { category, productId } = useParams();

  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bagMessage, setBagMessage] = useState('');
  const [addingToBag, setAddingToBag] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (!isValidCategory(category) || !productId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const p = await getCatalogProduct(category, productId);
        if (cancelled) return;
        if (!p) {
          setError(t('product.notFound'));
        } else {
          setProduct(p);
          setSelectedImageIndex(0);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(
              e,
              e?.response?.status === 404 ? t('product.notFound') : t('product.loadError'),
            ),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [category, productId, t]);

  if (!isValidCategory(category)) {
    return <Navigate to="/collections/necklaces" replace />;
  }

  const label = t(`category.${category}`);
  const listPath = `/collections/${category}`;

  if (loading) {
    return (
      <div className="product-detail container">
        <p className="product-detail__status">{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail container">
        <p className="product-detail__error">{error || t('product.notFound')}</p>
        <Link to={listPath} className="product-detail__back">
          {t('product.backTo', { category: label })}
        </Link>
      </div>
    );
  }

  const stockLabel = product.inStock
    ? product.quantity <= 3
      ? t('product.onlyLeft', { count: product.quantity })
      : t('category.inStock')
    : t('product.outOfStock');

  const handleAddToBag = async () => {
    setBagMessage('');


    setAddingToBag(true);
    const result = await addToCart(product.id, quantity, product);
    if (result.success) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2400);
      setBagMessage(t('product.addedMessage'));
    } else {
      setBagMessage(result.message);
    }
    setAddingToBag(false);
  };

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.imageUrl ? [product.imageUrl] : [];
  const currentImage = images[selectedImageIndex] || product.imageUrl;

  return (
    <div className="product-detail">
      <div className="container product-detail__inner">
        <Link to={listPath} className="product-detail__back">
          <ArrowLeft size={16} />
          {t('product.backTo', { category: label })}
        </Link>

        <div className="product-detail__layout">
          <div className="product-detail__media-col">
            <div className="product-detail__media media-frame media-frame--product-detail">
              {currentImage ? (
                <img src={currentImage} alt={product.name} />
              ) : (
                <div className="media-frame__placeholder product-detail__image-placeholder">{t('product.noImage')}</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="product-detail__gallery-thumbs">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`product-detail__gallery-thumb ${
                      selectedImageIndex === idx ? 'product-detail__gallery-thumb--active' : ''
                    }`}
                    onClick={() => setSelectedImageIndex(idx)}
                    aria-label={t('product.viewPhoto', { number: idx + 1 })}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-detail__info">
            <p className="product-detail__category">{label}</p>
            <h1 className="product-detail__title">{product.name}</h1>
            {product.onSale ? (
              <span className="product-detail__sale-badge">
                {t('product.saleBadge', { percent: product.discountPercent })}
              </span>
            ) : null}
            <div className="product-detail__pricing">
              {product.onSale ? (
                <span className="product-detail__price product-detail__price--original">
                  {formatMoney(product.originalPrice, locale)}
                </span>
              ) : null}
              <span className={`product-detail__price ${product.onSale ? 'product-detail__price--sale' : ''}`}>
                {formatMoney(getCurrentProductPrice(product), locale)}
              </span>
            </div>

            <div
              className={`product-detail__stock ${
                product.inStock ? 'product-detail__stock--in' : 'product-detail__stock--out'
              }`}
            >
              <span className="product-detail__stock-label">{t('product.availability')}</span>
              <span className="product-detail__stock-value">{stockLabel}</span>
              {product.inStock ? (
                <span className="product-detail__stock-qty">{t('product.availableCount', { count: product.quantity })}</span>
              ) : null}
            </div>

            <div className="product-detail__description">
              <h2>{t('product.description')}</h2>
              <p>{product.description || t('product.noDescription')}</p>
            </div>

            {product.inStock ? (
              <div className="product-detail__purchase">
                <label className="product-detail__qty-label" htmlFor="qty">
                  {t('product.quantity')}
                </label>
                <input
                  id="qty"
                  type="number"
                  className="product-detail__qty"
                  min={1}
                  max={product.quantity}
                  value={quantity}
                  onChange={(e) => {
                    const n = Math.max(1, Math.min(product.quantity, Number(e.target.value) || 1));
                    setQuantity(n);
                  }}
                />
              </div>
            ) : null}

            {bagMessage ? (
              <p
                className={`product-detail__bag-msg ${
                  bagMessage === t('product.addedMessage') ? 'product-detail__bag-msg--ok' : ''
                }`}
              >
                {bagMessage}
              </p>
            ) : null}

            <button
              type="button"
              className={`product-detail__cta ${justAdded ? 'product-detail__cta--added' : ''}`}
              disabled={!product.inStock || addingToBag}
              onClick={handleAddToBag}
            >
              {addingToBag ? (
                <span className="cta-loading-content">
                  <span className="cta-gold-spinner" />
                  <span>{t('product.adding')}</span>
                </span>
              ) : justAdded ? (
                <span className="cta-added-content">
                  <Check size={18} className="cta-check-icon" />
                  <span>{t('product.added')}</span>
                </span>
              ) : product.inStock ? (
                <span className="cta-default-content">
                  <span>{t('product.addToBag')}</span>
                  <span className="cta-btn-gleam" />
                </span>
              ) : (
                t('product.outOfStock')
              )}
            </button>

            {product.inStock ? (
              <Link to="/checkout" className="product-detail__checkout-link">
                {t('product.viewBag')}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
