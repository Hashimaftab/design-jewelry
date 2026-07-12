import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getCategoryLabel } from '../constants/productCategories';
import { formatStorePrice } from '../api/payments.api';
import './Checkout.css';

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
              <span>Return to Store</span>
            </Link>
            <h1 className="checkout-logo">HUSAN</h1>
          </header>

          <section className="form-section">
            <h2>Your bag</h2>
            <p className="form-desc">Review items before placing your order.</p>

            {error ? <p className="checkout-alert checkout-alert--error">{error}</p> : null}

            {loading ? (
              <p className="checkout-status">Loading your bag…</p>
            ) : isEmpty ? (
              <div className="checkout-empty">
                <p>Your bag is empty.</p>
                <Link to="/collections/necklaces" className="checkout-empty__link">
                  Browse collections
                </Link>
              </div>
            ) : (
              <ul className="checkout-bag-list">
                {cart.items.map((line) => {
                  const p = line.product;
                  const categoryLabel = p?.categorySlug
                    ? getCategoryLabel(p.categorySlug)
                    : p?.category ?? '';
                  const disabled = busyId === line.productId;

                  return (
                    <li key={line.productId} className="checkout-bag-item">
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
                        <p className="checkout-bag-item__unit">{formatStorePrice(p?.price ?? 0)} each</p>
                        <div className="checkout-bag-item__actions">
                          <div className="qty-control">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              disabled={disabled || line.quantity <= 1}
                              onClick={() => handleQtyChange(line.productId, line.quantity - 1)}
                            >
                              <Minus size={14} />
                            </button>
                            <span>{line.quantity}</span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              disabled={disabled}
                              onClick={() => handleQtyChange(line.productId, line.quantity + 1)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button
                            type="button"
                            className="checkout-bag-item__remove"
                            disabled={disabled}
                            onClick={() => handleRemove(line.productId)}
                            aria-label="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="checkout-bag-item__total">{formatStorePrice(line.lineTotal)}</div>
                    </li>
                  );
                })}
              </ul>
            )}

            {!isEmpty ? (
              <button
                type="button"
                className="pay-now-btn"
                disabled={checkoutBusy || loading}
                onClick={handlePlaceOrder}
              >
                {checkoutBusy ? 'Placing order…' : `Place order — ${formatStorePrice(cart.subtotal)}`}
              </button>
            ) : null}
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
                    <div className="item-price">{formatStorePrice(line.lineTotal)}</div>
                  </div>
                );
              })}
            </div>

            <div className="summary-totals">
              <div className="total-row">
                <span>Subtotal ({cart.itemCount} items)</span>
                <span>{formatStorePrice(cart.subtotal)}</span>
              </div>
              <div className="total-row">
                <span>Verzending</span>
                <span>Wordt berekend bij betaling</span>
              </div>
              <div className="total-row grand-total">
                <span>Totaal</span>
                <span>{formatStorePrice(cart.subtotal)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
