import { useContext, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContextValue';
import { AuthContext } from '../context/AuthContextValue';
import {
  getOrderPaymentSummary,
  getPublicPaymentStatus,
  formatStorePrice,
  ApiRequestError,
} from '../api/payments.api';
import { getApiErrorMessage } from '../utils/adminAuth';
import { useLanguage } from '../context/LanguageContextValue';

const POLL_ATTEMPTS = 8;
const POLL_INTERVAL_MS = 1500;

async function waitForPaidOrder(orderId, token, isCancelled) {
  let orderSummary;
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    if (isCancelled()) return null;
    orderSummary = await getOrderPaymentSummary(orderId, token);
    if (orderSummary?.paymentStatus === 'paid' || orderSummary?.paymentStatus === 'failed') {
      return orderSummary;
    }
    await new Promise((resolve) => { setTimeout(resolve, POLL_INTERVAL_MS); });
  }
  return orderSummary;
}

function SuccessIcon() {
  return (
    <div className="checkout-success__icon-wrap">
      <div className="checkout-success__ring-pulse" aria-hidden="true" />
      <div className="checkout-success__icon">
        <svg className="success-svg" viewBox="0 0 52 52">
          <circle className="success-svg__circle" cx="26" cy="26" r="24" fill="none" />
          <path className="success-svg__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
        </svg>
      </div>
    </div>
  );
}

function OrderConfirmDetails({ summary, orderId, t, locale, token }) {
  const ref = `#${(summary?.id ?? orderId)?.slice(0, 8).toUpperCase()}`;
  const contact = summary?.contact;
  const items = summary?.items ?? [];

  return (
    <div className="order-confirm">

      {/* Reference badge */}
      <div className="order-confirm__ref">
        <span>{t('success.orderRef')}</span>
        <strong>{ref}</strong>
      </div>

      {/* Items */}
      {items.length > 0 && (
        <div className="order-confirm__section">
          <h3>{t('success.itemsOrdered')}</h3>
          <div className="order-confirm__items">
            {items.map((item, i) => (
              <div key={i} className="order-confirm__item">
                <div className="order-confirm__item-left">
                  <span className="order-confirm__item-name">{item.productName}</span>
                  <span className="order-confirm__item-meta">
                    {t('success.qty')}: {item.quantity} · {formatStorePrice(item.unitPrice, locale)} {t('success.each')}
                  </span>
                </div>
                <span className="order-confirm__item-total">{formatStorePrice(item.lineTotal, locale)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="order-confirm__section">
        <h3>{t('success.orderSummary')}</h3>
        <div className="order-confirm__totals">
          {summary?.subtotalAmount != null && (
            <div className="order-confirm__total-row">
              <span>{t('success.subtotal')}</span>
              <span>{formatStorePrice(summary.subtotalAmount, locale)}</span>
            </div>
          )}
          {summary?.vatAmount != null && (
            <div className="order-confirm__total-row">
              <span>{summary?.vatLabel ?? t('success.tax')}</span>
              <span>{formatStorePrice(summary.vatAmount, locale)}</span>
            </div>
          )}
          {summary?.shippingAmount != null && (
            <div className="order-confirm__total-row">
              <span>{t('success.shipping')}</span>
              <span>{formatStorePrice(summary.shippingAmount, locale)}</span>
            </div>
          )}
          <div className="order-confirm__total-row order-confirm__total-row--grand">
            <span>{t('success.total')}</span>
            <strong>{formatStorePrice(summary?.grandTotalAmount ?? 0, locale)}</strong>
          </div>
        </div>
      </div>

      {/* Delivery address */}
      {contact && (
        <div className="order-confirm__section">
          <h3>{t('success.deliveryAddress')}</h3>
          <address className="order-confirm__address">
            {contact.fullName && <span>{contact.fullName}</span>}
            {contact.addressLine1 && <span>{contact.addressLine1}</span>}
            {contact.addressLine2 && <span>{contact.addressLine2}</span>}
            {(contact.city || contact.state || contact.postalCode) && (
              <span>{[contact.city, contact.state, contact.postalCode].filter(Boolean).join(', ')}</span>
            )}
            {contact.country && <span>{contact.country}</span>}
            {contact.phone && <span>{t('success.phone')}: {contact.phone}</span>}
            {contact.email && <span>{t('success.emailLabel')}: {contact.email}</span>}
          </address>
        </div>
      )}

      {/* Actions */}
      <div className="checkout-success__actions">
        <Link to="/" className="pay-now-btn checkout-success__btn">
          <span>{t('success.continue')}</span>
          <span className="pay-btn-gleam" />
        </Link>
        {token && (
          <Link to="/account" className="checkout-success__link">
            {t('success.orderHistory')}
          </Link>
        )}
      </div>
    </div>
  );
}

const OrderSuccess = () => {
  const { t, locale } = useLanguage();
  const translateRef = useRef(t);
  useEffect(() => { translateRef.current = t; }, [t]);
  const { token } = useContext(AuthContext);
  const { completePaidOrder } = useCart();
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const stripeRedirectStatus = searchParams.get('redirect_status');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        let orderSummary;
        try {
          orderSummary = await waitForPaidOrder(orderId, token, () => cancelled);
        } catch (err) {
          const paymentIntentId = searchParams.get('payment_intent');
          if (err instanceof ApiRequestError && err.status === 401 && stripeRedirectStatus === 'succeeded' && paymentIntentId) {
            const publicStatus = await getPublicPaymentStatus(orderId, paymentIntentId);
            if (publicStatus?.paymentStatus === 'paid') {
              orderSummary = {
                id: orderId,
                paymentStatus: 'paid',
                grandTotalAmount: publicStatus.grandTotalAmount,
              };
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }
        if (cancelled) return;
        if (orderSummary?.paymentStatus === 'paid' && (token || orderSummary.items)) {
          await completePaidOrder(orderId);
        }
        if (!cancelled) setSummary(orderSummary);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiRequestError
            ? err.message
            : getApiErrorMessage(err, translateRef.current('success.loadError')),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [token, orderId, stripeRedirectStatus, completePaidOrder, searchParams]);

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-container container">
          <p className="checkout-status">
            {stripeRedirectStatus === 'succeeded' ? t('success.confirming') : t('success.loading')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="checkout-page">
        <div className="checkout-container container">
          <p className="checkout-alert checkout-alert--error">{error}</p>
          <Link to="/" className="pay-now-btn">{t('common.backToShop')}</Link>
        </div>
      </div>
    );
  }

  if (summary?.paymentStatus !== 'paid') {
    return (
      <div className="checkout-page">
        <div className="checkout-container container checkout-container--narrow">
          <h1>{summary?.paymentStatus === 'failed' ? t('success.failedTitle') : t('success.pendingTitle')}</h1>
          <p>{t('success.pendingMessage')}</p>
          <Link to={`/payments/${orderId}`} className="pay-now-btn">{t('success.retryPayment')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container container checkout-container--narrow">
        <div className="checkout-success">
          <SuccessIcon />
          <h1>{t('success.title')}</h1>
          <p className="checkout-success__sub">
            {t('success.message', { order: `#${(summary?.id ?? orderId)?.slice(0, 8).toUpperCase()}` })}
          </p>
          <OrderConfirmDetails
            summary={summary}
            orderId={orderId}
            t={t}
            locale={locale}
            token={token}
          />
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
