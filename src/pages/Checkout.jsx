import { useContext, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, ShieldCheck, Sparkles, MapPin } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContextValue';
import { AuthContext } from '../context/AuthContextValue';
import { getCategoryLabel } from '../constants/productCategories';
import BrandLogo from '../components/BrandLogo';
import { formatStorePrice } from '../api/payments.api';
import { checkoutPayload, prepareCheckoutAttempt, readCheckoutAttempt, clearCheckoutAttempt } from '../utils/checkoutAttempt';
import { useLanguage } from '../context/LanguageContextValue';


const Checkout = () => {
  const { t, locale, language } = useLanguage();
  const getLocalizedCategoryLabel = (slug) => {
    const key = `category.${slug}`;
    const translated = t(key);
    return translated === key ? getCategoryLabel(slug) : translated;
  };
  const { cart, loading, cartError, refreshCart, updateQuantity, removeItem, placeOrder } = useCart();
  const { user } = useContext(AuthContext) || {};
  const submitting = useRef(false);
  const owner = user?.id || 'guest';
  const [busyId, setBusyId] = useState(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Shipping Address Form State
  const [shippingForm, setShippingForm] = useState(() => ({
    fullName: user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' '),
    email: user?.email || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: language === 'nl' ? 'Nederland' : 'Netherlands',
    notes: '',
    ...readCheckoutAttempt(owner)?.payload?.contact,
    ...(readCheckoutAttempt(owner) ? { notes: readCheckoutAttempt(owner).payload.notes } : {}),
  }));

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

    if (submitting.current || loading || busyId !== null || cartError) return;
    submitting.current = true;
    setCheckoutBusy(true);
    try {
      const payload = prepareCheckoutAttempt(checkoutPayload(shippingForm, cart.items), owner);
      const result = await placeOrder(payload);
      if (!result.success || !result.order?.id) throw new Error(result.message || t('checkout.placeError'));
      clearCheckoutAttempt();
      navigate(`/payments/${result.order.id}`, { replace: true });
    } catch (err) {
      setError(err.message || t('checkout.placeError'));
    } finally {
      submitting.current = false;
      setCheckoutBusy(false);
    }
  };

  const isEmpty = !loading && !cartError && cart.items.length === 0;

  return (
    <div className="checkout-page">
      <div className="checkout-container container">
        <div className="checkout-main">
          <header className="checkout-header">
            <Link to="/" className="back-link">
              <ArrowLeft size={16} />
              <span>{t('checkout.returnBoutique')}</span>
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
              <span className="checkout-step__label">{t('checkout.selectionStep')}</span>
            </div>
            <div className="checkout-step__line checkout-step__line--gold" />
            <div className="checkout-step checkout-step--active">
              <div className="checkout-step__circle">2</div>
              <span className="checkout-step__label">{t('checkout.deliveryStep')}</span>
            </div>
            <div className="checkout-step__line" />
            <div className="checkout-step">
              <div className="checkout-step__circle">3</div>
              <span className="checkout-step__label">{t('checkout.confirmationStep')}</span>
            </div>
          </div>

          {/* Bag Items Section */}
          <section className="form-section">
            <div className="section-heading-wrap">
              <h2>{t('checkout.yourSelection')}</h2>
              <span className="luxury-tag">
                <Sparkles size={13} />
                <span>{t('checkout.insuredDelivery')}</span>
              </span>
            </div>
            <p className="form-desc">{t('checkout.guestText')}</p>

            {error ? <p role="alert" className="checkout-alert checkout-alert--error">{error}</p> : null}
            {cartError ? <div role="alert" className="checkout-alert checkout-alert--error">{cartError} <button type="button" onClick={refreshCart}>{t('checkout.retryBag')}</button></div> : null}

            {loading ? (
              <p className="checkout-status">{t('checkout.preparingBag')}</p>
            ) : isEmpty ? (
              <div className="checkout-empty">
                <p>{t('checkout.empty')}</p>
                <Link to="/collections/necklaces" className="checkout-empty__link">
                  {t('checkout.explore')}
                </Link>
              </div>
            ) : (
              <ul className="checkout-bag-list">
                <AnimatePresence mode="popLayout">
                  {cart.items.map((line, idx) => {
                    const p = line.product;
                    const categoryLabel = p?.categorySlug
                      ? getLocalizedCategoryLabel(p.categorySlug)
                      : p?.category ?? '';
                    const disabled = checkoutBusy || busyId !== null;

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
                          <h4>{p?.name ?? t('checkout.product')}</h4>
                          {categoryLabel ? <p>{categoryLabel}</p> : null}
                          <p className="checkout-bag-item__unit">{formatStorePrice(p?.price ?? 0, locale)} {t('checkout.each')}</p>
                          <div className="checkout-bag-item__actions">
                            <div className="qty-control">
                              <button
                                type="button"
                                aria-label={t('checkout.decrease')}
                                disabled={disabled || line.quantity <= 1}
                                onClick={() => handleQtyChange(line.productId, line.quantity - 1)}
                              >
                                <Minus size={13} />
                              </button>
                              <span>{line.quantity}</span>
                              <button
                                type="button"
                                aria-label={t('checkout.increase')}
                                disabled={disabled || line.quantity >= 100}
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
                              aria-label={t('checkout.removeItem')}
                            >
                              <Trash2 size={15} />
                              <span className="remove-text">{t('checkout.remove')}</span>
                            </button>
                          </div>
                        </div>
                        <div className="checkout-bag-item__total">{formatStorePrice(line.lineTotal, locale)}</div>
                      </Motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </section>

          {/* Delivery & Shipping Information Section */}
          {!isEmpty && !loading && !cartError && (
            <section className="form-section">
              <div className="section-heading-wrap">
                <h2>{t('checkout.shippingAddress')}</h2>
                <span className="luxury-tag">
                  <MapPin size={13} />
                  <span>{t('checkout.whiteGlove')}</span>
                </span>
              </div>
              <p className="form-desc">{t('checkout.addressIntro')}</p>

              <form onSubmit={handlePlaceOrder} className="payment-form">
                <fieldset disabled={checkoutBusy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
                <div className="form-grid">
                  <div className="form-row">
                    <label htmlFor="ship-fullname">{t('checkout.fullName')}</label>
                    <input
                      id="ship-fullname"
                      maxLength={200} autoComplete="name" minLength={2}
                      type="text"
                      required
                      placeholder={t('checkout.fullNamePlaceholder')}
                      value={shippingForm.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="ship-email">{t('checkout.email')}</label>
                    <input
                      id="ship-email"
                      maxLength={254} autoComplete="email"
                      type="email"
                      required
                      placeholder={t('checkout.emailPlaceholder')}
                      value={shippingForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="ship-phone">{t('checkout.phone')}</label>
                    <input
                      id="ship-phone"
                      maxLength={30} autoComplete="tel"
                      type="tel"
                      required
                      placeholder={t('checkout.phonePlaceholder')}
                      value={shippingForm.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <label htmlFor="ship-addr1">{t('checkout.street')}</label>
                  <input
                    id="ship-addr1"
                      maxLength={255} autoComplete="address-line1"
                    type="text"
                    required
                    placeholder={t('checkout.streetPlaceholder')}
                    value={shippingForm.addressLine1}
                    onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="ship-addr2">{t('checkout.addressExtra')}</label>
                  <input
                    id="ship-addr2"
                      maxLength={255} autoComplete="address-line2"
                    type="text"
                    placeholder={t('checkout.addressExtraPlaceholder')}
                    value={shippingForm.addressLine2}
                    onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                  />
                </div>

                <div className="form-grid">
                  <div className="form-row">
                    <label htmlFor="ship-city">{t('checkout.city')}</label>
                    <input
                      id="ship-city"
                      maxLength={100} autoComplete="address-level2"
                      type="text"
                      required
                      placeholder={t('checkout.cityPlaceholder')}
                      value={shippingForm.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="ship-state">{t('checkout.state')}</label>
                    <input
                      id="ship-state"
                      maxLength={100} autoComplete="address-level1"
                      type="text"
                      placeholder={t('checkout.statePlaceholder')}
                      value={shippingForm.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="ship-zip">{t('checkout.postalCode')}</label>
                    <input
                      id="ship-zip"
                      maxLength={30} autoComplete="postal-code"
                      type="text"
                      required
                      placeholder={t('checkout.postalCodePlaceholder')}
                      value={shippingForm.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <label htmlFor="ship-country">{t('checkout.country')}</label>
                  <input id="ship-country" autoComplete="country-name" required maxLength={100}
                    value={shippingForm.country} onChange={(event) => handleInputChange('country', event.target.value)} />
                </div>
                <div className="form-row">
                  <label htmlFor="ship-notes">{t('checkout.notes')}</label>
                  <input
                    id="ship-notes"
                      maxLength={1000} autoComplete="off"
                    type="text"
                    placeholder={t('checkout.notesPlaceholder')}
                    value={shippingForm.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="pay-now-btn"
                  disabled={checkoutBusy || loading || busyId !== null}
                >
                  {checkoutBusy ? (
                    <span className="btn-loading-state">
                      <span className="cta-gold-spinner" />
                      <span>{t('checkout.placing')}</span>
                    </span>
                  ) : (
                    <span className="btn-ready-state">
                      <span>{t('checkout.placeContinue')}</span>
                      <span className="pay-btn-gleam" />
                    </span>
                  )}
                </button>

                <div className="checkout-security-badge">
                  <ShieldCheck size={16} />
                  <span>{t('checkout.security')}</span>
                </div>
                </fieldset>
              </form>
            </section>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <aside className="checkout-sidebar">
          <div className="summary-card">
            <h3>{t('checkout.summary')}</h3>

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
                      <h4>{p?.name ?? t('checkout.product')}</h4>
                      <p>{p?.categorySlug ? getLocalizedCategoryLabel(p.categorySlug) : ''}</p>
                    </div>
                    <div className="item-price">{formatStorePrice(line.lineTotal, locale)}</div>
                  </div>
                );
              })}
            </div>

            <div className="summary-totals">
              <div className="total-row">
                <span>{t('checkout.subtotalItems', { count: cart.itemCount })}</span>
                <span>{formatStorePrice(cart.subtotal, locale)}</span>
              </div>
              <div className="total-row">
                <span>{t('checkout.shippingTaxes')}</span>
                <span>{t('checkout.calculatedPayment')}</span>
              </div>
              <div className="total-row grand-total">
                <span>{t('checkout.itemsSubtotal')}</span>
                <span>{formatStorePrice(cart.subtotal, locale)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
