import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { AuthContext } from '../context/AuthContext';
import {
  ApiRequestError,
  formatStorePrice,
  getStoreConfig,
  getOrderPaymentSummary,
  createStripePaymentIntent,
} from '../api/payments.api';
import { getApiErrorMessage } from '../utils/adminAuth';
import './Checkout.css';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = publishableKey ? loadStripe(publishableKey, { locale: 'nl' }) : null;

function PaymentCheckoutForm({ orderId, grandTotal, returnUrl, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    onError('');

    if (!stripe || !elements) {
      onError('Payment form is still loading. Please wait a moment.');
      return;
    }

    setBusy(true);

    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: 'if_required',
      });

      if (confirmError) {
        onError(confirmError.message || 'Payment failed.');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        navigate(`/order-success/${orderId}`, { replace: true });
        return;
      }

      onError('Payment did not complete. Please try again.');
    } catch (err) {
      onError(err?.message || 'Payment failed.');
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
                address: { country: 'NL' },
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
        {busy ? 'Processing…' : `Pay ${formatStorePrice(grandTotal)}`}
      </button>
    </form>
  );
}

const Payment = () => {
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
        ? { clientSecret, locale: 'nl', appearance: { theme: 'stripe' } }
        : null,
    [clientSecret],
  );

  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        if (!publishableKey) {
          throw new Error(
            'Stripe is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY in your environment.',
          );
        }

        const configRes = await getStoreConfig();
        const config = configRes?.store ?? configRes;
        const diagnostics = configRes?.payments ?? null;
        const orderSummary = await getOrderPaymentSummary(orderId, token);

        if (orderSummary?.paymentStatus === 'paid') {
          navigate(`/order-success/${orderId}`, { replace: true });
          return;
        }

        const intent = await createStripePaymentIntent(orderId, token);
        if (!intent?.clientSecret) {
          throw new Error('Could not start payment session.');
        }

        setStoreConfig(config);
        setPaymentDiagnostics(diagnostics);
        setSummary(orderSummary);
        setClientSecret(intent.clientSecret);
      } catch (err) {
        setError(
          err instanceof ApiRequestError
            ? err.message
            : getApiErrorMessage(err, 'Could not load payment details.'),
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, orderId, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-container container">
          <p className="checkout-status">Loading payment details…</p>
        </div>
      </div>
    );
  }

  if (!summary || !clientSecret || !elementsOptions) {
    return (
      <div className="checkout-page">
        <div className="checkout-container container">
          <p className="checkout-alert checkout-alert--error">
            {error || 'Payment session unavailable.'}
          </p>
          <Link to="/checkout" className="pay-now-btn">
            Back to bag
          </Link>
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
              <span>Back to bag</span>
            </Link>
            <h1 className="checkout-logo">Payment</h1>
          </header>

          <section className="form-section">
            <h2>Order payment</h2>
            <p className="form-desc">
              Pay securely with iDEAL | Wero or card (Visa, Mastercard). Payment details are
              handled by Stripe and never touch our servers.
            </p>

            {paymentDiagnostics && !paymentDiagnostics.idealTestIntentOk ? (
              <p className="checkout-alert checkout-alert--error">
                iDEAL is not available for this Stripe account
                {paymentDiagnostics.stripeAccountCountry
                  ? ` (country: ${paymentDiagnostics.stripeAccountCountry})`
                  : ''}
                . Use a Netherlands/EU Stripe business profile, or pay by card.
                {paymentDiagnostics.idealTestError
                  ? ` Stripe: ${paymentDiagnostics.idealTestError}`
                  : ''}
              </p>
            ) : null}

            {error ? <p className="checkout-alert checkout-alert--error">{error}</p> : null}

            <div className="summary-card">
              <div className="summary-items">
                <div className="summary-item">
                  <span>Order</span>
                  <strong>#{orderId?.slice(0, 8)}</strong>
                </div>
                <div className="summary-item">
                  <span>Subtotaal</span>
                  <strong>{formatStorePrice(summary.subtotalAmount)}</strong>
                </div>
                <div className="summary-item">
                  <span>
                    {summary.vatLabel} ({summary.vatRatePercent}%)
                  </span>
                  <strong>{formatStorePrice(summary.vatAmount)}</strong>
                </div>
                <div className="summary-item">
                  <span>Verzending</span>
                  <strong>{formatStorePrice(summary.shippingAmount)}</strong>
                </div>
                <div className="summary-item grand-total">
                  <span>Total</span>
                  <strong>{formatStorePrice(summary.grandTotalAmount)}</strong>
                </div>
              </div>
            </div>

            {stripePromise ? (
              <Elements stripe={stripePromise} options={elementsOptions}>
                <PaymentCheckoutForm
                  orderId={orderId}
                  grandTotal={summary.grandTotalAmount}
                  returnUrl={returnUrl}
                  onError={setError}
                />
              </Elements>
            ) : (
              <p className="checkout-alert checkout-alert--error">
                Stripe publishable key is missing.
              </p>
            )}
          </section>
        </div>

        <aside className="checkout-sidebar">
          <div className="summary-card">
            <h3>Store info</h3>
            <div className="summary-item">
              <span>Country</span>
              <strong>{storeConfig?.countryCode ?? 'NL'}</strong>
            </div>
            <div className="summary-item">
              <span>Locale</span>
              <strong>{storeConfig?.locale ?? 'nl-NL'}</strong>
            </div>
            <div className="summary-item">
              <span>Currency</span>
              <strong>{storeConfig?.currencyCode?.toUpperCase() ?? 'EUR'}</strong>
            </div>
            <div className="summary-item">
              <span>VAT</span>
              <strong>
                {storeConfig?.vatRatePercent}% {storeConfig?.vatLabel}
              </strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Payment;
