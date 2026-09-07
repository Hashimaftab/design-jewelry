import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getOrderPaymentSummary, formatStorePrice, ApiRequestError } from '../api/payments.api';
import { getApiErrorMessage } from '../utils/adminAuth';
import './Checkout.css';

const POLL_ATTEMPTS = 8;
const POLL_INTERVAL_MS = 1500;

async function waitForPaidOrder(orderId, token, stripeRedirectSucceeded) {
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    const orderSummary = await getOrderPaymentSummary(orderId, token);
    if (orderSummary?.paymentStatus === 'paid') {
      return orderSummary;
    }

    if (!stripeRedirectSucceeded && attempt === 0) {
      return null;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, POLL_INTERVAL_MS);
    });
  }

  return null;
}

const OrderSuccess = () => {
  const { token } = useContext(AuthContext);
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const stripeRedirectStatus = searchParams.get('redirect_status');

  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { from: `/order-success/${orderId}` }, replace: true });
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const stripeRedirectSucceeded = stripeRedirectStatus === 'succeeded';
        const orderSummary = await waitForPaidOrder(orderId, token, stripeRedirectSucceeded);

        if (!orderSummary) {
          navigate(`/payments/${orderId}`, { replace: true });
          return;
        }

        setSummary(orderSummary);
      } catch (err) {
        setError(
          err instanceof ApiRequestError
            ? err.message
            : getApiErrorMessage(err, 'Could not load order.'),
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, orderId, navigate, stripeRedirectStatus]);

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-container container">
          <p className="checkout-status">
            {stripeRedirectStatus === 'succeeded'
              ? 'Confirming your payment…'
              : 'Loading order confirmation…'}
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
          <Link to="/" className="pay-now-btn">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

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
            Thank you for choosing our boutique. Your bespoke order <strong>#{orderId?.slice(0, 8)}</strong> has been placed and is being prepared with utmost care.
          </p>
          <div className="checkout-success__total-badge">
            <span>Total Paid</span>
            <strong>{formatStorePrice(summary.grandTotalAmount)}</strong>
          </div>
          <div className="checkout-success__actions">
            <Link to="/" className="pay-now-btn checkout-success__btn">
              <span>Continue Browsing</span>
              <span className="pay-btn-gleam" />
            </Link>
            <Link to="/account" className="checkout-success__link">
              View Order History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
