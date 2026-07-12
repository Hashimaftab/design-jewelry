import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import {
  ApiRequestError,
  STRIPE_TEST_CARD,
  formatStorePrice,
  getStoreConfig,
  getOrderPaymentSummary,
  createStripePaymentIntent,
  confirmCardPayment,
} from '../api/payments.api';
import { getApiErrorMessage } from '../utils/adminAuth';
import './Checkout.css';

const Payment = () => {
  const { token } = useContext(AuthContext);
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [storeConfig, setStoreConfig] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [card, setCard] = useState({
    cardNumber: '',
    cvv: '',
    expMonth: 12,
    expYear: 2030,
  });

  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const config = await getStoreConfig();
        const orderSummary = await getOrderPaymentSummary(orderId, token);

        if (orderSummary?.paymentStatus === 'paid') {
          navigate(`/order-success/${orderId}`, { replace: true });
          return;
        }

        setStoreConfig(config);
        setSummary(orderSummary);
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : getApiErrorMessage(err, 'Could not load payment details.'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, orderId, navigate, location.pathname]);

  const handleTestCard = () => {
    setCard({
      cardNumber: STRIPE_TEST_CARD.cardNumber,
      cvv: STRIPE_TEST_CARD.cvv,
      expMonth: STRIPE_TEST_CARD.expMonth,
      expYear: STRIPE_TEST_CARD.expYear,
    });
  };

  const handlePay = async (event) => {
    event.preventDefault();
    setError('');

    if (!summary) {
      setError('Payment summary not available.');
      return;
    }

    setBusy(true);
    try {
      await createStripePaymentIntent(orderId, 'card', token);
      const result = await confirmCardPayment(orderId, card, token);
      if (result?.paymentStatus === 'paid') {
        navigate(`/order-success/${orderId}`);
      } else {
        setError(result?.message || 'Payment did not complete.');
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : getApiErrorMessage(err, 'Payment failed.'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-container container">
          <p className="checkout-status">Loading payment details…</p>
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
            <p className="form-desc">Complete your payment in EUR with 21% BTW.</p>

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
                  <span>{summary.vatLabel} ({summary.vatRatePercent}%)</span>
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

            <form onSubmit={handlePay} className="payment-form">
              <div className="form-row">
                <label htmlFor="cardNumber">Kaartnummer</label>
                <input
                  id="cardNumber"
                  type="text"
                  value={card.cardNumber}
                  maxLength={19}
                  onChange={(e) => setCard({ ...card, cardNumber: e.target.value })}
                  placeholder="4242 4242 4242 4242"
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-row">
                  <label htmlFor="expMonth">Maand</label>
                  <input
                    id="expMonth"
                    type="number"
                    min={1}
                    max={12}
                    value={card.expMonth}
                    onChange={(e) => setCard({ ...card, expMonth: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="expYear">Jaar</label>
                  <input
                    id="expYear"
                    type="number"
                    min={new Date().getFullYear()}
                    value={card.expYear}
                    onChange={(e) => setCard({ ...card, expYear: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="cvv">CVV</label>
                  <input
                    id="cvv"
                    type="text"
                    maxLength={4}
                    value={card.cvv}
                    onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button type="button" className="pay-now-btn" onClick={handleTestCard} disabled={busy}>
                Use test card
              </button>
              <button type="submit" className="pay-now-btn" disabled={busy}>
                {busy ? 'Processing…' : `Pay ${formatStorePrice(summary.grandTotalAmount)}`}
              </button>
            </form>
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
              <strong>{storeConfig?.vatRatePercent}% {storeConfig?.vatLabel}</strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Payment;
