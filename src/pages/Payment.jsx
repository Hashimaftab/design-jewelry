import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { AuthContext } from '../context/AuthContextValue';
import {
  ApiRequestError,
  formatStorePrice,
  getStoreConfig,
  getOrderPaymentSummary,
  createStripePaymentIntent,
} from '../api/payments.api';
import { getApiErrorMessage } from '../utils/adminAuth';
import { useLanguage } from '../context/LanguageContextValue';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function PaymentCheckoutForm({ orderId, grandTotal, returnUrl, billingCountry, onError }) {
  const { t, locale } = useLanguage();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    onError('');

    if (!stripe || !elements) {
      onError(t('payment.formLoading'));
      return;
    }

    if (busy) {
      return; // Prevent double submission
    }

    setBusy(true);

    try {
      // Log for debugging

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          payment_method_data: {
            billing_details: {
              address: {
                country: billingCountry,
              },
            },
          },
        },
        redirect: 'if_required',
      });


      if (result?.error) {
        const errorMessage = result.error.message || result.error.code || t('payment.failed');
        onError(t('payment.errorPrefix', { message: errorMessage }));
        return;
      }

      const paymentIntent = result?.paymentIntent;

      if (!paymentIntent) {
        onError(t('payment.noResponse'));
        return;
      }


      if (paymentIntent.status === 'succeeded') {
        navigate(`/order-success/${orderId}`, { replace: true });
        return;
      }

      if (paymentIntent.status === 'processing') {
        onError(t('payment.processingStatus'));
        // Optionally redirect after a delay
        setTimeout(() => {
          navigate(`/order-success/${orderId}`, { replace: true });
        }, 2000);
        return;
      }

      if (paymentIntent.status === 'requires_payment_method') {
        onError(t('payment.validDetails'));
        return;
      }

      if (paymentIntent.status === 'requires_action') {
        onError(t('payment.authentication'));
        return;
      }

      onError(t('payment.status', { status: paymentIntent.status }));
    } catch (err) {
      onError(err?.message || t('payment.unexpected'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-element-wrap">
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['ideal', 'card'],
            defaultValues: {
              billingDetails: {
                address: { country: billingCountry },
              },
            },
            fields: {
              billingDetails: {
                address: { country: 'never' },
              },
            },
          }}
        />
      </div>
      <button type="submit" className="pay-now-btn" disabled={!stripe || busy}>
        {busy ? t('payment.processing') : t('payment.payAmount', { amount: formatStorePrice(grandTotal, locale) })}
      </button>
    </form>
  );
}

const Payment = () => {
  const { t, locale, language } = useLanguage();
  const translateRef = useRef(t);
  useEffect(() => { translateRef.current = t; }, [t]);
  const { token } = useContext(AuthContext);
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [storeConfig, setStoreConfig] = useState(null);
  const [paymentDiagnostics, setPaymentDiagnostics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const returnUrl = useMemo(
    () => `${window.location.origin}/order-success/${orderId}`,
    [orderId],
  );

  const elementsOptions = useMemo(
    () =>
      clientSecret
        ? { clientSecret, locale: language === 'nl' ? 'nl' : 'en', appearance: { theme: 'stripe' } }
        : null,
    [clientSecret, language],
  );

  useEffect(() => {


    let cancelled = false;

    const load = async () => {
      const translate = translateRef.current;
      setLoading(true);
      setError('');

      try {
        if (!publishableKey) {
          throw new Error(
            translate('payment.onlineUnavailable'),
          );
        }

        const configRes = await getStoreConfig();
        const config = configRes?.store ?? configRes;
        if (config?.currencyCode && config.currencyCode.toUpperCase() !== 'EUR') {
          throw new Error(translate('payment.euroUnavailable'));
        }
        const diagnostics = configRes?.payments ?? null;
        const orderSummary = await getOrderPaymentSummary(orderId, token);
        if (cancelled) return;

        if (orderSummary?.paymentStatus === 'paid') {
          navigate(`/order-success/${orderId}`, { replace: true });
          return;
        }

        const intent = await createStripePaymentIntent(orderId, token);
        if (cancelled) return;
        if (!intent?.clientSecret) {
          throw new Error(
            translate('payment.startError'),
          );
        }

        setStoreConfig(config);
        setPaymentDiagnostics(diagnostics);
        setSummary(orderSummary);
        setClientSecret(intent.clientSecret);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiRequestError
            ? err.message
            : getApiErrorMessage(err, translate('payment.loadError'));
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [token, orderId, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-container container">
          <p className="checkout-status">{t('payment.loading')}</p>
        </div>
      </div>
    );
  }

  if (!summary || !clientSecret || !elementsOptions) {
    return (
      <div className="checkout-page">
        <div className="checkout-container container">
          <p className="checkout-alert checkout-alert--error">
            {error || t('payment.sessionUnavailable')}
          </p>
          <Link to="/checkout" className="pay-now-btn">
            {t('payment.backToBag')}
          </Link>
          <button type="button" className="pay-now-btn" onClick={() => window.location.reload()}>{t('payment.retry')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container container">
        <div className="checkout-main">
          <header className="checkout-header">
            <Link to="/checkout" className="back-link">
              <ArrowLeft size={16} />
              <span>{t('payment.backToBag')}</span>
            </Link>
            <h1 className="checkout-logo">{t('payment.title')}</h1>
          </header>

          <section className="form-section">
            <h2>{t('payment.orderPayment')}</h2>
            <p className="form-desc">{t('payment.orderPlaced')}</p>
            <p className="form-desc">
              {t('payment.secureText')}
            </p>

            {paymentDiagnostics && !paymentDiagnostics.idealTestIntentOk ? (
              <p className="checkout-alert checkout-alert--error">
                {t('payment.idealUnavailable')}
              </p>
            ) : null}

            {error ? <p className="checkout-alert checkout-alert--error">{error}</p> : null}

            <div className="summary-card">
              <div className="summary-items">
                <div className="summary-item">
                  <span>{t('payment.order')}</span>
                  <strong>#{orderId?.slice(0, 8)}</strong>
                </div>
                <div className="summary-item">
                  <span>{t('payment.subtotal')}</span>
                  <strong>{formatStorePrice(summary.subtotalAmount, locale)}</strong>
                </div>
                {summary.vatAmount > 0 ? (
                  <div className="summary-item">
                    <span>
                      {summary.vatLabel} ({summary.vatRatePercent}%)
                    </span>
                    <strong>{formatStorePrice(summary.vatAmount, locale)}</strong>
                  </div>
                ) : null}
                {summary.shippingAmount > 0 ? (
                  <div className="summary-item">
                    <span>{t('payment.shipping')}</span>
                    <strong>{formatStorePrice(summary.shippingAmount, locale)}</strong>
                  </div>
                ) : null}
                <div className="summary-item grand-total">
                  <span>{t('payment.total')}</span>
                  <strong>{formatStorePrice(summary.grandTotalAmount, locale)}</strong>
                </div>
              </div>
            </div>

            {stripePromise ? (
              <Elements stripe={stripePromise} options={elementsOptions}>
                <PaymentCheckoutForm
                  orderId={orderId}
                  grandTotal={summary.grandTotalAmount}
                  returnUrl={returnUrl}
                  billingCountry={storeConfig?.countryCode ?? 'NL'}
                  onError={setError}
                  token={token}
                />
              </Elements>
            ) : (
              <p className="checkout-alert checkout-alert--error">
                {t('payment.missingKey')}
              </p>
            )}
          </section>
        </div>

        <aside className="checkout-sidebar">
          <div className="summary-card">
            <h3>{t('payment.storeInfo')}</h3>
            <div className="summary-item">
              <span>{t('payment.country')}</span>
              <strong>{storeConfig?.countryCode ?? 'NL'}</strong>
            </div>
            <div className="summary-item">
              <span>{t('payment.locale')}</span>
              <strong>{storeConfig?.locale ?? 'nl-NL'}</strong>
            </div>
            <div className="summary-item">
              <span>{t('payment.currency')}</span>
              <strong>{storeConfig?.currencyCode?.toUpperCase() ?? 'EUR'}</strong>
            </div>
            {storeConfig?.vatRatePercent > 0 ? (
              <div className="summary-item">
                <span>{t('payment.vat')}</span>
                <strong>
                  {storeConfig.vatRatePercent}% {storeConfig.vatLabel}
                </strong>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Payment;
