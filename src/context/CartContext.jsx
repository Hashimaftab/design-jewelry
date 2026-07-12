import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  getCart,
  addToCart as addToCartApi,
  updateCartItem as updateCartItemApi,
  removeFromCart as removeFromCartApi,
  clearCart as clearCartApi,
  checkoutCart,
} from '../api/cart.api';
import { AuthContext } from './AuthContext';
import { getApiErrorMessage } from '../utils/adminAuth';

export const CartContext = createContext(null);

const emptyCart = { items: [], itemCount: 0, subtotal: 0 };

export const CartProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!token) {
      setCart(emptyCart);
      return { success: true, cart: emptyCart };
    }

    setLoading(true);
    try {
      const next = await getCart();
      setCart(next);
      return { success: true, cart: next };
    } catch (error) {
      setCart(emptyCart);
      return {
        success: false,
        message: getApiErrorMessage(error, 'Could not load your bag.'),
      };
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      await addToCartApi({ productId, quantity });
      const next = await getCart();
      setCart(next);
      return { success: true, cart: next };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, 'Could not add to bag.'),
      };
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const next =
        quantity <= 0
          ? await removeFromCartApi(productId)
          : await updateCartItemApi(productId, { quantity });
      setCart(next);
      return { success: true, cart: next };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, 'Could not update bag.'),
      };
    }
  };

  const removeItem = async (productId) => {
    try {
      const next = await removeFromCartApi(productId);
      setCart(next);
      return { success: true, cart: next };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, 'Could not remove item.'),
      };
    }
  };

  const clearBag = async () => {
    try {
      const next = await clearCartApi();
      setCart(next);
      return { success: true, cart: next };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, 'Could not clear bag.'),
      };
    }
  };

  const placeOrder = async () => {
    try {
      const order = await checkoutCart();
      setCart(emptyCart);
      return { success: true, order };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, 'Checkout failed.'),
      };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
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

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
