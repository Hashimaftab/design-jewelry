import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Sparkles, X, ShoppingBag } from 'lucide-react';
import { formatStorePrice as formatMoney } from '../utils/currency';
import { getCurrentProductPrice } from '../utils/productHelpers';
import { useCart } from '../context/CartContextValue';
import { useLanguage } from '../context/LanguageContextValue';
import './CartToast.css';

const CartToast = () => {
  const { cart, cartToast, dismissToast } = useCart();
  const { t, locale } = useLanguage();
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!cartToast) return undefined;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [cartToast]);

  if (!cartToast) return null;

  return createPortal(
    <dialog ref={dialogRef} className="bag-drawer" aria-labelledby="bag-drawer-title"
      onCancel={(event) => { event.preventDefault(); dismissToast(); }}
      onClick={(event) => { if (event.target === event.currentTarget) dismissToast(); }}>
      <div className="bag-drawer__panel">
        <header className="bag-drawer__header">
          <h2 id="bag-drawer-title"><Sparkles size={20} aria-hidden="true" />{t('cart.added')}</h2>
          <button type="button" className="bag-drawer__close" onClick={dismissToast} aria-label={t('cart.closeNotification')} autoFocus><X size={24} /></button>
        </header>
        <div className="bag-drawer__items">
          {cart.items.map((item) => {
            const product = item.product;
            const price = getCurrentProductPrice(product);
            return (
              <article className="bag-drawer__item" key={item.productId}>
                {product?.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <div className="bag-drawer__placeholder"><ShoppingBag size={32} /></div>}
                <div className="bag-drawer__details">
                  <h3>{product?.name || t('cart.jewelryPiece')}</h3>
                  <p>{t('product.quantity')}: {item.quantity}</p>
                  <p>{formatMoney(price, locale)} {t('checkout.each')}</p>
                  <strong>{formatMoney(item.lineTotal ?? price * item.quantity, locale)}</strong>
                </div>
              </article>
            );
          })}
        </div>
        <footer className="bag-drawer__footer">
          <div className="bag-drawer__subtotal"><span>{t('checkout.subtotalItems', { count: cart.itemCount })}</span><strong>{formatMoney(cart.subtotal, locale)}</strong></div>
          <Link to="/checkout" className="bag-drawer__checkout" onClick={dismissToast}>{t('cart.viewCheckout')}</Link>
          <p className="bag-drawer__notice">{t('cart.checkoutNotice')}</p>
        </footer>
      </div>
    </dialog>, document.body,
  );
};

export default CartToast;
