/**
 * HUSAN Luxury Jewelry - Orders & Admin API Client
 *
 * Uses the same API configuration and authentication as the rest of the app.
 */

import adminAxiosInstance from './adminAxiosInstance';
import axiosInstance from './axiosInstance';
import { API_BASE_URL } from './config';
import { checkoutCart } from './cart.api';
import { orderHeaders } from './orderAccess';
import { getAdminOrdersPage } from '../utils/adminOrderHelpers';

const ORDERS_API_BASE_URL = API_BASE_URL;

/**
 * Helper to make HTTP requests
 */
async function request(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const client = cleanEndpoint.startsWith('/admin/') ? adminAxiosInstance : axiosInstance;
  const { body, ...config } = options;

  try {
    return await client.request({
      ...config,
      baseURL: ORDERS_API_BASE_URL.replace(/\/+$/, ''),
      url: cleanEndpoint,
      data: body,
    });
  } catch (error) {
    error.message = error.response?.data?.message || error.message;
    error.status = error.response?.status;
    error.data = error.response?.data;
    throw error;
  }
}

export const ordersApi = {
  // Shared checkout saves guest access before the caller navigates to payment.
  async placeOrder(orderData) {
    return { success: true, data: { order: await checkoutCart(orderData) } };
  },

  /**
   * 2. Get Admin Orders History with Filters
   *
   * @param {Object} [params]
   * @param {'pending'|'delivered'|'shipped'|'processing'|'cancelled'|'refunded'|'all'} [params.status] - Filter by shipping status
   * @param {'pending'|'requires_payment'|'paid'|'failed'} [params.payment_status]
   * @param {string} [params.search] - Search order number, customer name, or email
   * @param {number} [params.page=1]
   * @param {number} [params.limit=15]
   * @returns {Promise<{status: string, message?: string, data: {orders: Array, statistics: Object, total_items: number, total_pages: number, current_page: number, per_page: number}}>}
   */
  async getAdminOrders(params = {}) {
    const response = await request('/admin/orders', { method: 'GET' });
    if (!Array.isArray(response?.data?.orders)) throw new Error('Invalid orders response. Please retry.');
    return { ...response, data: getAdminOrdersPage(response.data.orders, params) };
  },

  /**
   * 3. Get Single Admin Order Details
   *
   * @param {number|string} orderId
   * @returns {Promise<{status: string, data: Object}>}
   */
  async getAdminOrder(orderId) {
    const response = await request('/admin/orders', { method: 'GET' });
    const order = response.data.orders.find((item) => item.id === orderId);
    if (!order) throw new Error('Order not found');
    return { ...response, data: order };
  },

  /**
   * 4. Update Order Shipping Status (Pending ⇄ Delivered)
   *
   * @param {number|string} orderId
   * @param {'pending'|'delivered'|'shipped'|'processing'|'cancelled'} status
   * @returns {Promise<{status: string, message: string, data: Object}>}
   */
  async updateShippingStatus(orderId, status) {
    const response = await request(`/admin/orders/${orderId}`, {
      method: 'PATCH',
      body: { shippingStatus: status },
    });
    return { ...response, data: response.data.order };
  },

  /**
   * 5. Update Order Payment Status
   *
   * @param {number|string} orderId
   * @param {'pending'|'requires_payment'|'paid'|'failed'} paymentStatus
   * @returns {Promise<{status: string, message: string, data: Object}>}
   */
  async updatePaymentStatus(orderId, paymentStatus) {
    const response = await request(`/admin/orders/${orderId}`, {
      method: 'PATCH',
      body: { paymentStatus },
    });
    return { ...response, data: response.data.order };
  },

  /**
   * 6. Customer: Get Own Orders History
   *
   * @param {number} [page=1]
   * @param {number} [limit=15]
   * @returns {Promise<{status: string, data: {orders: Array, total_items: number}}>}
   */
  async getMyOrders(page = 1, limit = 15) {
    return request(`/cart/orders?page=${page}&limit=${limit}`, {
      method: 'GET',
    });
  },

  /**
   * 7. Customer: Get Single Order Details
   *
   * @param {number|string} orderId
   * @returns {Promise<{status: string, data: Object}>}
   */
  async getMyOrder(orderId) {
    return request(`/orders/${orderId}`, {
      method: 'GET',
      headers: orderHeaders(orderId),
    });
  },
};

export default ordersApi;
