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
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function PaymentCheckoutForm({ orderId, grandTotal, returnUrl, onError, token }) {
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

    if (busy) {
      return; // Prevent double submission
    }

    setBusy(true);

    try {
      // Log for debugging
      console.log('Starting payment confirmation for order:', orderId);
      console.log('Return URL:', returnUrl);

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { 
          return_url: returnUrl 
        },
        redirect: 'if_required',
      });

      console.log('Payment result:', result);

      if (result?.error) {
        console.error('Stripe payment error:', result.error);
        const errorMessage = result.error.message || result.error.code || 'Payment failed';
        onError(`Payment Error: ${errorMessage}`);
        return;
      }

      const paymentIntent = result?.paymentIntent;

      if (!paymentIntent) {
        onError('No payment response from Stripe. Please try again.');
        return;
      }

      console.log('Payment intent status:', paymentIntent.status);

      if (paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded, redirecting to success page');
        navigate(`/order-success/${orderId}`, { replace: true });
        return;
      }

      if (paymentIntent.status === 'processing') {
        console.log('Payment is processing');
        onError('Payment is processing. Please wait...');
        // Optionally redirect after a delay
        setTimeout(() => {
          navigate(`/order-success/${orderId}`, { replace: true });
        }, 2000);
        return;
      }

      if (paymentIntent.status === 'requires_payment_method') {
        onError('Please provide valid payment details');
        return;
      }

      if (paymentIntent.status === 'requires_action') {
        onError('Payment requires authentication. Please complete the verification.');
        return;
      }

      onError(`Payment status: ${paymentIntent.status}. Please contact support if this persists.`);
    } catch (err) {
      console.error('Payment exception:', err);
      onError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-element-wrap">
        <PaymentElement options={{ layout: 'tabs' }} />
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
  const [summary, setSummary] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const returnUrl = useMemo(
    () => `${window.location.origin}/order-success/${orderId}`,
    [orderId],
  );

  const elementsOptions = useMemo(
    () => (clientSecret ? { clientSecret, appearance: { theme: 'stripe' } } : null),
    [clientSecret],
  );

  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        if (!publishableKey) {
          throw new Error(
            'Stripe is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY in your environment.',
          );
        }

        const config = await getStoreConfig();
        if (cancelled) return;

        const orderSummary = await getOrderPaymentSummary(orderId, token);
        if (cancelled) return;

        if (orderSummary?.paymentStatus === 'paid') {
          navigate(`/order-success/${orderId}`, { replace: true });
          return;
        }

        const intent = await createStripePaymentIntent(orderId, 'card', token);
        if (cancelled) return;

        if (!intent?.clientSecret) {
          throw new Error(
            `Could not start payment session. Backend response: ${JSON.stringify(intent)}`,
          );
        }

        setStoreConfig(config);
        setSummary(orderSummary);
        setClientSecret(intent.clientSecret);
      } catch (err) {
        if (cancelled) return;
        console.error('Payment setup error:', err);
        const message =
          err instanceof ApiRequestError
            ? `API Error (${err.status}): ${err.message}`
            : getApiErrorMessage(err, 'Could not load payment details.');
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
              Pay securely with Stripe. Card details are handled by Stripe and never touch our
              servers.
            </p>

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
                  token={token}
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
