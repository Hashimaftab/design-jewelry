import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './CartToast.css';

const formatMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const CartToast = () => {
  const { cartToast, dismissToast } = useCart();

  useEffect(() => {
    if (!cartToast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 4500);
    return () => clearTimeout(timer);
  }, [cartToast, dismissToast]);

  if (!cartToast) return null;

  return (
    <div className="cart-toast-container" role="alert" aria-live="assertive">
      <div className="cart-toast">
        <div className="cart-toast__header">
          <div className="cart-toast__badge">
            <Sparkles size={14} className="cart-toast__sparkle" />
            <span>Added to Your Bag</span>
          </div>
          <button
            type="button"
            className="cart-toast__close"
            onClick={dismissToast}
            aria-label="Close notification"
          >
            <X size={15} />
          </button>
        </div>

        <div className="cart-toast__body">
          {cartToast.imageUrl ? (
            <img
              src={cartToast.imageUrl}
              alt={cartToast.name}
              className="cart-toast__thumb"
            />
          ) : (
            <div className="cart-toast__thumb-placeholder">
              <ShoppingBag size={18} />
            </div>
          )}
          <div className="cart-toast__info">
            <h4 className="cart-toast__name">{cartToast.name}</h4>
            {cartToast.price ? (
              <p className="cart-toast__price">
                {cartToast.quantity > 1 ? `${cartToast.quantity} × ` : ''}
                {formatMoney(cartToast.price)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="cart-toast__actions">
          <Link
            to="/checkout"
            className="cart-toast__btn"
            onClick={dismissToast}
          >
            <span>View Bag & Checkout</span>
            <span className="cart-toast__btn-gleam" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartToast;
