import { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, ShieldCheck, Sparkles, MapPin } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContextValue';
import { AuthContext } from '../context/AuthContextValue';
import { getCategoryLabel } from '../constants/productCategories';
import BrandLogo from '../components/BrandLogo';
import { formatStorePrice } from '../api/payments.api';
import { ordersApi } from '../api/ordersApiClient';

const Checkout = () => {
  const { cart, loading, updateQuantity, removeItem, clearBag, placeOrder: fallbackPlaceOrder } = useCart();
  const { user } = useContext(AuthContext) || {};
  const [busyId, setBusyId] = useState(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const navigate = useNavigate();

  // Shipping Address Form State
  const [shippingForm, setShippingForm] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    paymentMethod: 'credit_card',
    notes: '',
  });

  const handleInputChange = (field, value) => {
    setShippingForm((prev) => ({ ...prev, [field]: value }));
  };

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

  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();
    setError('');

    // Validation
    if (!shippingForm.fullName.trim()) {
      setError('Please provide your full name for delivery.');
      return;
    }
    if (!shippingForm.email.trim()) {
      setError('Please provide a valid contact email for order confirmation.');
      return;
    }
    if (!shippingForm.phone.trim()) {
      setError('Please provide a contact phone number for insured courier delivery.');
      return;
    }
    if (!shippingForm.addressLine1.trim() || !shippingForm.city.trim() || !shippingForm.postalCode.trim()) {
      setError('Please complete the delivery address (Street, City, and Postal Code are required).');
      return;
    }

    setCheckoutBusy(true);

    try {
      // Build order payload matching backend API specification
      const orderPayload = {
        items: cart.items.map((line) => {
          const rawId = line.product?.id ?? line.productId;
          const numId = parseInt(rawId, 10);
          return {
            product_id: isNaN(numId) ? 1 : numId,
            quantity: Number(line.quantity) || 1,
            ring_size: line.ringSize || line.ring_size || 7,
          };
        }),
        shipping_address: {
          full_name: shippingForm.fullName.trim(),
          email: shippingForm.email.trim(),
          phone: shippingForm.phone.trim(),
          address_line1: shippingForm.addressLine1.trim(),
          address_line2: shippingForm.addressLine2.trim() || null,
          city: shippingForm.city.trim(),
          state: shippingForm.state.trim() || null,
          postal_code: shippingForm.postalCode.trim(),
          country: shippingForm.country.trim() || 'United States',
        },
        payment_method: shippingForm.paymentMethod || 'credit_card',
        notes: shippingForm.notes.trim() || null,
      };

      let res;
      try {
        res = await ordersApi.placeOrder(orderPayload);
      } catch (apiErr) {
        // If the primary orders API endpoint is unavailable, attempt the fallback placeOrder
        if (fallbackPlaceOrder) {
          const fallbackRes = await fallbackPlaceOrder();
          if (fallbackRes.success && fallbackRes.order?.id) {
            navigate(`/payments/${fallbackRes.order.id}`);
            return;
          }
        }
        throw apiErr;
      }

      const orderData = res?.data || res?.order || {};
      setConfirmedOrder(orderData);

      // Clear the local shopping bag on successful order placement
      if (clearBag) {
        await clearBag();
      }
    } catch (err) {
      setError(err.message || 'An error occurred while placing your order. Please try again.');
    } finally {
      setCheckoutBusy(false);
    }
  };

  const isEmpty = !loading && cart.items.length === 0;

  // Render Confirmation Screen when order is successfully placed
  if (confirmedOrder) {
    const orderNumber = confirmedOrder.order_number || `#HUS-${confirmedOrder.id || '2026-CONFIRMED'}`;
    const totalPaid = confirmedOrder.total || confirmedOrder.subtotal || cart.subtotal;

    return (
      <div className="checkout-page">
        <div className="checkout-container container checkout-container--narrow">
          <div className="checkout-success">
            <div className="checkout-success__icon-wrap">
              <div className="checkout-success__ring-pulse" aria-hidden="true" />
              <div className="checkout-success__icon">
                <svg className="success-svg" viewBox="0 0 52 52">
                  <circle className="success-svg__circle" cx="26" cy="26" r="24" fill="none" />
                  <path className="success-svg__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
              </div>
            </div>

            <h1>Order Confirmed</h1>
            <p className="checkout-success__sub">
              Thank you for acquiring from HUSAN Luxury Jewelry. Your bespoke order{' '}
              <strong>{orderNumber}</strong> has been received and our master artisans have begun preparation.
            </p>

            <div className="checkout-success__total-badge">
              <span>Total Investment</span>
              <strong>{formatStorePrice(totalPaid)}</strong>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#6b7280', maxWidth: '28rem', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
              A confirmation and fulfillment notice has been dispatched to <strong>{shippingForm.email}</strong> and store concierge.
            </p>

            <div className="checkout-success__actions">
              <Link to="/" className="pay-now-btn checkout-success__btn">
                <span>Continue Browsing</span>
                <span className="pay-btn-gleam" />
              </Link>
              <Link to="/admin/orders" className="checkout-success__link">
                Inspect in Admin Ledger
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <span className="checkout-step__label">Curated Selection</span>
            </div>
            <div className="checkout-step__line checkout-step__line--gold" />
            <div className="checkout-step checkout-step--active">
              <div className="checkout-step__circle">2</div>
              <span className="checkout-step__label">Atelier Delivery</span>
            </div>
            <div className="checkout-step__line" />
            <div className="checkout-step">
              <div className="checkout-step__circle">3</div>
              <span className="checkout-step__label">Confirmation</span>
            </div>
          </div>

          {/* Bag Items Section */}
          <section className="form-section">
            <div className="section-heading-wrap">
              <h2>Your Selection</h2>
              <span className="luxury-tag">
                <Sparkles size={13} />
                <span>Complimentary Insured Delivery</span>
              </span>
            </div>
            <p className="form-desc">Review your selected creations before confirming atelier fulfillment.</p>

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
                      <Motion.li
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
                          <p className="checkout-bag-item__unit">{formatStorePrice(p?.price ?? 0)} each</p>
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
                        <div className="checkout-bag-item__total">{formatStorePrice(line.lineTotal)}</div>
                      </Motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </section>

          {/* Delivery & Shipping Information Section */}
          {!isEmpty && (
            <section className="form-section">
              <div className="section-heading-wrap">
                <h2>Shipping & Delivery Address</h2>
                <span className="luxury-tag">
                  <MapPin size={13} />
                  <span>White-Glove Courier</span>
                </span>
              </div>
              <p className="form-desc">Please enter your destination coordinates for high-security delivery.</p>

              <form onSubmit={handlePlaceOrder} className="payment-form">
                <div className="form-grid">
                  <div className="form-row">
                    <label htmlFor="ship-fullname">Full Name *</label>
                    <input
                      id="ship-fullname"
                      type="text"
                      required
                      placeholder="e.g. Jane Doe"
                      value={shippingForm.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="ship-email">Email Address *</label>
                    <input
                      id="ship-email"
                      type="email"
                      required
                      placeholder="e.g. jane@example.com"
                      value={shippingForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="ship-phone">Phone Number *</label>
                    <input
                      id="ship-phone"
                      type="tel"
                      required
                      placeholder="e.g. +1 (555) 0199"
                      value={shippingForm.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <label htmlFor="ship-addr1">Street Address *</label>
                  <input
                    id="ship-addr1"
                    type="text"
                    required
                    placeholder="e.g. 742 Evergreen Terrace"
                    value={shippingForm.addressLine1}
                    onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="ship-addr2">Apartment, Suite, Unit (Optional)</label>
                  <input
                    id="ship-addr2"
                    type="text"
                    placeholder="e.g. Apt 4B, Penthouse Suite"
                    value={shippingForm.addressLine2}
                    onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                  />
                </div>

                <div className="form-grid">
                  <div className="form-row">
                    <label htmlFor="ship-city">City *</label>
                    <input
                      id="ship-city"
                      type="text"
                      required
                      placeholder="e.g. Springfield"
                      value={shippingForm.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="ship-state">State / Province</label>
                    <input
                      id="ship-state"
                      type="text"
                      placeholder="e.g. OR / NY"
                      value={shippingForm.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="ship-zip">Postal / Zip Code *</label>
                    <input
                      id="ship-zip"
                      type="text"
                      required
                      placeholder="e.g. 97477"
                      value={shippingForm.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <label htmlFor="ship-notes">Bespoke Instructions / Gift Box Notes</label>
                  <input
                    id="ship-notes"
                    type="text"
                    placeholder="e.g. Please package in velvet luxury gift box with custom wax seal."
                    value={shippingForm.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="pay-now-btn"
                  disabled={checkoutBusy || loading}
                >
                  {checkoutBusy ? (
                    <span className="btn-loading-state">
                      <span className="cta-gold-spinner" />
                      <span>Placing Your Order…</span>
                    </span>
                  ) : (
                    <span className="btn-ready-state">
                      <span>Confirm & Place Order — {formatStorePrice(cart.subtotal)}</span>
                      <span className="pay-btn-gleam" />
                    </span>
                  )}
                </button>

                <div className="checkout-security-badge">
                  <ShieldCheck size={16} />
                  <span>Encrypted Order Fulfillment with Automated Concierge Notification</span>
                </div>
              </form>
            </section>
          )}
        </div>

        {/* Order Summary Sidebar */}
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
                <span>Insured Luxury Delivery</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>Complimentary</span>
              </div>
              <div className="total-row grand-total">
                <span>Total</span>
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
