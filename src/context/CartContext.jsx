import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  getCart,
  addToCart as addToCartApi,
  updateCartItem as updateCartItemApi,
  removeFromCart as removeFromCartApi,
  clearCart as clearCartApi,
  checkoutCart,
} from '../api/cart.api';
import { AuthContext } from './AuthContextValue';
import { getApiErrorMessage } from '../utils/adminAuth';

import { CartContext } from './CartContextValue';
import { readGuestCart, writeGuestCart } from '../utils/guestCart';
import { useLanguage } from './LanguageContextValue';

const emptyCart = { items: [], itemCount: 0, subtotal: 0 };

export const CartProvider = ({ children }) => {
  const { t } = useLanguage();
  const { token } = useContext(AuthContext);
  const [cartState, setCartState] = useState(() => ({ owner: token, cart: token ? emptyCart : readGuestCart() }));
  const cart = cartState.owner === token ? cartState.cart : token ? emptyCart : readGuestCart();
  const setCart = useCallback((next) => setCartState({ owner: token, cart: next }), [token]);
  const [cartError, setCartError] = useState('');
  const refreshSequence = useRef(0);
  const [loading, setLoading] = useState(false);
  const [cartBounceKey, setCartBounceKey] = useState(0);
  const [cartToast, setCartToast] = useState(null);

  const dismissToast = useCallback(() => {
    setCartToast(null);
  }, []);

  const refreshCart = useCallback(async () => {
    const sequence = ++refreshSequence.current;
    setCartError('');
    if (!token) {
      const guest = readGuestCart();
      setCart(guest);
      setLoading(false);
      return { success: true, cart: guest };
    }

    setLoading(true);
    try {
      const next = await getCart();
      if (sequence !== refreshSequence.current) return { success: false };
      setCart(next);
      return { success: true, cart: next };
    } catch (error) {
      if (sequence !== refreshSequence.current) return { success: false };
      setCartError(getApiErrorMessage(error, t('cart.loadError')));
      return {
        success: false,
        message: getApiErrorMessage(error, t('cart.loadError')),
      };
    } finally {
      if (sequence === refreshSequence.current) setLoading(false);
    }
  }, [token, setCart, t]);

  useEffect(() => {
    refreshCart();
    return () => { refreshSequence.current += 1; };
  }, [refreshCart]);

  const addToCart = async (productId, quantity = 1, productDetails = null) => {
    try {
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new Error(t('cart.quantityRange'));
      let next;
      if (!token) {
        const items = readGuestCart().items;
        const existing = items.find((item) => item.productId === productId);
        if (existing) {
          if (existing.quantity + quantity > 100) throw new Error(t('cart.maxQuantity'));
          existing.quantity += quantity;
        }
        else if (productDetails) items.push({ productId, quantity, product: productDetails });
        else throw new Error(t('cart.openProductFirst'));
        next = writeGuestCart(items);
      } else {
        await addToCartApi({ productId, quantity });
        next = await getCart();
      }
      setCart(next);
      setCartBounceKey((k) => k + 1);

      // Find product details from newly updated items or fallback to provided details
      const foundItem = next.items?.find((it) => it.productId === productId);
      const toastPayload = {
        name: productDetails?.name || foundItem?.product?.name || t('cart.jewelryPiece'),
        imageUrl: productDetails?.imageUrl || productDetails?.image || foundItem?.product?.imageUrl,
        price: productDetails?.price || foundItem?.product?.price,
        quantity,
      };
      setCartToast(toastPayload);

      return { success: true, cart: next };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, t('cart.addError')),
      };
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > 100) throw new Error(t('cart.updateQuantityRange'));
      const next = !token
        ? writeGuestCart(readGuestCart().items.map((item) => item.productId === productId ? { ...item, quantity } : item).filter((item) => item.quantity > 0))
        : quantity <= 0
          ? await removeFromCartApi(productId)
          : await updateCartItemApi(productId, { quantity });
      setCart(next);
      return { success: true, cart: next };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, t('cart.updateError')),
      };
    }
  };

  const removeItem = async (productId) => {
    try {
      const next = !token ? writeGuestCart(readGuestCart().items.filter((item) => item.productId !== productId)) : await removeFromCartApi(productId);
      setCart(next);
      return { success: true, cart: next };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, t('cart.removeError')),
      };
    }
  };

  const clearBag = async () => {
    try {
      const next = !token ? writeGuestCart([]) : await clearCartApi();
      setCart(next);
      return { success: true, cart: next };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, t('cart.clearError')),
      };
    }
  };

  const placeOrder = async (details) => {
    try {
      const order = await checkoutCart(details);
      if (!token) writeGuestCart([]);
      setCart(emptyCart);
      return { success: true, order };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, t('cart.checkoutError')),
      };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        cartError,
        cartBounceKey,
        cartToast,
        dismissToast,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearBag,
        placeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
