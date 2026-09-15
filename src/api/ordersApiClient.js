/**
 * HUSAN Luxury Jewelry - Orders & Admin API Client
 *
 * Uses the same API configuration and authentication as the rest of the app.
 */

import adminAxiosInstance from './adminAxiosInstance';
import axiosInstance from './axiosInstance';
import { API_BASE_URL } from './config';
import { getAdminOrdersPage } from '../utils/adminOrderHelpers';

const ORDERS_API_BASE_URL =
  import.meta.env.VITE_ORDERS_API_URL ||
  import.meta.env.VITE_API_URL ||
  API_BASE_URL;

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
  /**
   * 1. Place a new order (Customer Checkout)
   * Automatically sends email notification to admin (hassanaftab912@gmail.com).
   *
   * @param {Object} orderData
   * @param {Array<{product_id: number, quantity: number, ring_size?: number|string}>} orderData.items
   * @param {Object} orderData.shipping_address
   * @param {string} orderData.shipping_address.full_name
   * @param {string} orderData.shipping_address.email
   * @param {string} orderData.shipping_address.phone
   * @param {string} orderData.shipping_address.address_line1
   * @param {string} [orderData.shipping_address.address_line2]
   * @param {string} orderData.shipping_address.city
   * @param {string} [orderData.shipping_address.state]
   * @param {string} orderData.shipping_address.postal_code
   * @param {string} [orderData.shipping_address.country]
   * @param {string} [orderData.payment_method] - e.g. 'credit_card', 'cash_on_delivery'
   * @param {string} [orderData.notes]
   * @returns {Promise<{status: string, message: string, data: Object}>}
   */
  async placeOrder(orderData) {
    return request('/orders', {
      method: 'POST',
      body: orderData,
    });
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
    return { ...response, data: getAdminOrdersPage(response?.data?.orders || [], params) };
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
    return request(`/orders?page=${page}&limit=${limit}`, {
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
    });
  },
};

export default ordersApi;
