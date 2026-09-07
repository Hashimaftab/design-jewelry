import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { getCategoryLabel } from '../constants/productCategories';
import BrandLogo from '../components/BrandLogo';
import './Checkout.css';

const formatMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const Checkout = () => {
  const { cart, loading, updateQuantity, removeItem, placeOrder } = useCart();
  const [busyId, setBusyId] = useState(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleQtyChange = async (productId, nextQty) => {
    setError('');
    setBusyId(productId);
    const result = await updateQuantity(productId, nextQty);
    if (!result.success) setError(result.message);
    setBusyId(null);
  };

  const handleRemove = async (productId) => {
    setError('');
    setBusyId(productId);
    const result = await removeItem(productId);
    if (!result.success) setError(result.message);
    setBusyId(null);
  };

  const handlePlaceOrder = async () => {
    setError('');
    setCheckoutBusy(true);
    const result = await placeOrder();
    if (result.success && result.order?.id) {
      navigate(`/payments/${result.order.id}`);
    } else {
      setError(result.message);
    }
    setCheckoutBusy(false);
  };

  const isEmpty = !loading && cart.items.length === 0;

  return (
    <div className="checkout-page">
      <div className="checkout-container container">
        <div className="checkout-main">
          <header className="checkout-header">
            <Link to="/" className="back-link">
              <ArrowLeft size={16} />
              <span>Return to Boutique</span>
            </Link>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <BrandLogo
                variant="dark"
                className="auth-logo-img"
                style={{ height: '56px', margin: '0 auto' }}
              />
            </Link>
          </header>

          {/* Luxury Checkout Stepper */}
          <div className="checkout-stepper">
            <div className="checkout-step checkout-step--active">
              <div className="checkout-step__circle">1</div>
              <span className="checkout-step__label">Shopping Bag</span>
            </div>
            <div className="checkout-step__line checkout-step__line--gold" />
            <div className="checkout-step">
              <div className="checkout-step__circle">2</div>
              <span className="checkout-step__label">Payment</span>
            </div>
            <div className="checkout-step__line" />
            <div className="checkout-step">
              <div className="checkout-step__circle">3</div>
              <span className="checkout-step__label">Confirmation</span>
            </div>
          </div>

          <section className="form-section">
            <div className="section-heading-wrap">
              <h2>Your Selection</h2>
              <span className="luxury-tag">
                <Sparkles size={13} />
                <span>Complimentary Insured Delivery</span>
              </span>
            </div>
            <p className="form-desc">Review your curated pieces before completing your order.</p>

            {error ? <p className="checkout-alert checkout-alert--error">{error}</p> : null}

            {loading ? (
              <p className="checkout-status">Preparing your jewelry bag…</p>
            ) : isEmpty ? (
              <div className="checkout-empty">
                <p>Your shopping bag is currently empty.</p>
                <Link to="/collections/necklaces" className="checkout-empty__link">
                  Explore Collections
                </Link>
              </div>
            ) : (
              <ul className="checkout-bag-list">
                <AnimatePresence mode="popLayout">
                  {cart.items.map((line, idx) => {
                    const p = line.product;
                    const categoryLabel = p?.categorySlug
                      ? getCategoryLabel(p.categorySlug)
                      : p?.category ?? '';
                    const disabled = busyId === line.productId;

                    return (
                      <motion.li
                        key={line.productId}
                        className="checkout-bag-item"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.25 } }}
                        transition={{ duration: 0.35, delay: idx * 0.05 }}
                      >
                        <div className="checkout-bag-item__img media-frame media-frame--thumb">
                          {p?.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} />
                          ) : (
                            <div className="media-frame__placeholder" aria-hidden />
                          )}
                        </div>
                        <div className="checkout-bag-item__body">
                          <h4>{p?.name ?? 'Product'}</h4>
                          {categoryLabel ? <p>{categoryLabel}</p> : null}
                          <p className="checkout-bag-item__unit">{formatMoney(p?.price ?? 0)} each</p>
                          <div className="checkout-bag-item__actions">
                            <div className="qty-control">
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                disabled={disabled || line.quantity <= 1}
                                onClick={() => handleQtyChange(line.productId, line.quantity - 1)}
                              >
                                <Minus size={13} />
                              </button>
                              <span>{line.quantity}</span>
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                disabled={disabled}
                                onClick={() => handleQtyChange(line.productId, line.quantity + 1)}
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                            <button
                              type="button"
                              className="checkout-bag-item__remove"
                              disabled={disabled}
                              onClick={() => handleRemove(line.productId)}
                              aria-label="Remove item"
                            >
                              <Trash2 size={15} />
                              <span className="remove-text">Remove</span>
                            </button>
                          </div>
                        </div>
                        <div className="checkout-bag-item__total">{formatMoney(line.lineTotal)}</div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}

            {!isEmpty ? (
              <button
                type="button"
                className="pay-now-btn"
                disabled={checkoutBusy || loading}
                onClick={handlePlaceOrder}
              >
                {checkoutBusy ? (
                  <span className="btn-loading-state">
                    <span className="cta-gold-spinner" />
                    <span>Initiating Checkout…</span>
                  </span>
                ) : (
                  <span className="btn-ready-state">
                    <span>Proceed to Payment — {formatMoney(cart.subtotal)}</span>
                    <span className="pay-btn-gleam" />
                  </span>
                )}
              </button>
            ) : null}

            <div className="checkout-security-badge">
              <ShieldCheck size={16} />
              <span>256-Bit Encrypted Secure Checkout with Stripe</span>
            </div>
          </section>
        </div>

        <aside className="checkout-sidebar">
          <div className="summary-card">
            <h3>Order Summary</h3>

            <div className="summary-items">
              {cart.items.map((line) => {
                const p = line.product;
                return (
                  <div key={line.productId} className="summary-item">
                    <div className="item-img">
                      {p?.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} />
                      ) : null}
                      <span className="item-qty">{line.quantity}</span>
                    </div>
                    <div className="item-info">
                      <h4>{p?.name ?? 'Product'}</h4>
                      <p>{p?.categorySlug ? getCategoryLabel(p.categorySlug) : ''}</p>
                    </div>
                    <div className="item-price">{formatMoney(line.lineTotal)}</div>
                  </div>
                );
              })}
            </div>

            <div className="summary-totals">
              <div className="total-row">
                <span>Subtotal ({cart.itemCount} items)</span>
                <span>{formatMoney(cart.subtotal)}</span>
              </div>
              <div className="total-row">
                <span>Shipping</span>
                <span>Complimentary</span>
              </div>
              <div className="total-row grand-total">
                <span>Total</span>
                <span>{formatMoney(cart.subtotal)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
