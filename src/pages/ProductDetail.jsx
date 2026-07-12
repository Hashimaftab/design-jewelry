import { useContext, useEffect, useState } from 'react';
import { Link, useParams, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getCatalogProduct } from '../api/catalog.api';
import { isValidCategory, getCategoryLabel } from '../constants/productCategories';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getApiErrorMessage } from '../utils/adminAuth';
import './ProductDetail.css';

const formatMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const ProductDetail = () => {
  const { category, productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useContext(AuthContext);
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bagMessage, setBagMessage] = useState('');
  const [addingToBag, setAddingToBag] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!isValidCategory(category) || !productId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const p = await getCatalogProduct(category, productId);
        if (cancelled) return;
        if (!p) setError('Product not found.');
        else setProduct(p);
      } catch (e) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(
              e,
              e?.response?.status === 404 ? 'Product not found.' : 'Could not load product.',
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
  }, [category, productId]);

  if (!isValidCategory(category)) {
    return <Navigate to="/collections/necklaces" replace />;
  }

  const label = getCategoryLabel(category);
  const listPath = `/collections/${category}`;

  if (loading) {
    return (
      <div className="product-detail container">
        <p className="product-detail__status">Loading…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail container">
        <p className="product-detail__error">{error || 'Product not found.'}</p>
        <Link to={listPath} className="product-detail__back">
          Back to {label}
        </Link>
      </div>
    );
  }

  const stockLabel = product.inStock
    ? product.quantity <= 3
      ? `Only ${product.quantity} left`
      : 'In stock'
    : 'Out of stock';

  const handleAddToBag = async () => {
    setBagMessage('');
    if (!token) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    setAddingToBag(true);
    const result = await addToCart(product.id, quantity);
    if (result.success) {
      setBagMessage('Added to your bag.');
    } else {
      setBagMessage(result.message);
    }
    setAddingToBag(false);
  };

  return (
    <div className="product-detail">
      <div className="container product-detail__inner">
        <Link to={listPath} className="product-detail__back">
          <ArrowLeft size={16} />
          Back to {label}
        </Link>

        <div className="product-detail__layout">
          <div className="product-detail__media media-frame media-frame--product-detail">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} />
            ) : (
              <div className="media-frame__placeholder product-detail__image-placeholder">No image</div>
            )}
          </div>

          <div className="product-detail__info">
            <p className="product-detail__category">{label}</p>
            <h1 className="product-detail__title">{product.name}</h1>
            <p className="product-detail__price">{formatMoney(product.price)}</p>

            <div
              className={`product-detail__stock ${
                product.inStock ? 'product-detail__stock--in' : 'product-detail__stock--out'
              }`}
            >
              <span className="product-detail__stock-label">Availability</span>
              <span className="product-detail__stock-value">{stockLabel}</span>
              {product.inStock ? (
                <span className="product-detail__stock-qty">{product.quantity} available</span>
              ) : null}
            </div>

            <div className="product-detail__description">
              <h2>Description</h2>
              <p>{product.description || 'No description provided.'}</p>
            </div>

            {product.inStock ? (
              <div className="product-detail__purchase">
                <label className="product-detail__qty-label" htmlFor="qty">
                  Quantity
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
                  bagMessage.includes('Added') ? 'product-detail__bag-msg--ok' : ''
                }`}
              >
                {bagMessage}
              </p>
            ) : null}

            <button
              type="button"
              className="product-detail__cta"
              disabled={!product.inStock || addingToBag}
              onClick={handleAddToBag}
            >
              {addingToBag ? 'Adding…' : product.inStock ? 'Add to bag' : 'Out of stock'}
            </button>

            {token && product.inStock ? (
              <Link to="/checkout" className="product-detail__checkout-link">
                View bag & checkout
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
