/**
 * Customer shopping bag & checkout — Bearer token required
 * GET/DELETE /cart, POST /cart/items, PATCH/DELETE /cart/items/:productId
 * POST /cart/checkout, GET /cart/orders
 */

import axiosInstance from './axiosInstance';
import { CART_ROUTES } from './config';
import {
  parseCartResponse,
  parseOrderResponse,
  parseOrdersListResponse,
} from '../utils/cartHelpers';

export { CART_ROUTES };

/** @returns {Promise<{ items: object[], itemCount: number, subtotal: number }>} */
export const getCart = async () => {
  const res = await axiosInstance.get(CART_ROUTES.cart);
  return parseCartResponse(res);
};

/** @returns {Promise<{ items: object[], itemCount: number, subtotal: number }>} */
export const clearCart = async () => {
  const res = await axiosInstance.delete(CART_ROUTES.cart);
  return parseCartResponse(res);
};

/**
 * @param {{ productId: string, quantity?: number }} payload
 */
export const addToCart = async (payload) => {
  const res = await axiosInstance.post(CART_ROUTES.items, payload);
  return parseCartResponse(res);
};

/**
 * @param {string} productId
 * @param {{ quantity: number }} payload — quantity 0 removes the line
 */
export const updateCartItem = async (productId, payload) => {
  const res = await axiosInstance.patch(CART_ROUTES.item(productId), payload);
  return parseCartResponse(res);
};

/** @param {string} productId */
export const removeFromCart = async (productId) => {
  const res = await axiosInstance.delete(CART_ROUTES.item(productId));
  return parseCartResponse(res);
};

/** @returns {Promise<ReturnType<parseOrderResponse>>} */
export const checkoutCart = async () => {
  const res = await axiosInstance.post(CART_ROUTES.checkout);
  return parseOrderResponse(res);
};

/** @returns {Promise<ReturnType<parseOrderResponse>[]>} */
export const listMyOrders = async () => {
  const res = await axiosInstance.get(CART_ROUTES.orders);
  return parseOrdersListResponse(res);
};

/** @param {string} orderId */
export const getMyOrder = async (orderId) => {
  const res = await axiosInstance.get(CART_ROUTES.order(orderId));
  return parseOrderResponse(res);
};
