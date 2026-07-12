/**
 * API base URL — set VITE_API_BASE_URL in .env (e.g. http://localhost:3000/api/v1)
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

/** Origin for static files (uploads). Defaults to API host without /api/v1 */
export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  API_BASE_URL.replace(/\/api\/v\d+\/?$/i, '') ||
  'http://localhost:3000';

/** Customer (storefront) auth routes — relative to API_BASE_URL */
export const USER_ROUTES = {
  register: '/auth/register',
  login: '/auth/login',
  refreshToken: '/auth/refresh-token',
  logout: '/auth/logout',
  me: '/auth/me',
};

/** Public storefront catalog — GET /products/{category} */
export const CATALOG_ROUTES = {
  list: (category) => `/products/${category}`,
  detail: (category, id) => `/products/${category}/${id}`,
};

/** Customer shopping bag — Bearer token required */
export const CART_ROUTES = {
  cart: '/cart',
  items: '/cart/items',
  item: (productId) => `/cart/items/${productId}`,
  checkout: '/cart/checkout',
  orders: '/cart/orders',
  order: (orderId) => `/cart/orders/${orderId}`,
};

/** Payment and Stripe integration */
export const PAYMENT_ROUTES = {
  storeConfig: '/payments/store-config',
  orderSummary: (orderId) => `/payments/orders/${orderId}/summary`,
  createIntent: (orderId) => `/payments/orders/${orderId}/intent`,
  confirmPayment: (orderId) => `/payments/orders/${orderId}/confirm`,
};

/** Admin panel auth — mounted at /api/v1/admin/auth */
export const ADMIN_ROUTES = {
  login: '/admin/auth/login',
  refreshToken: '/admin/auth/refresh-token',
  logout: '/admin/auth/logout',
  me: '/admin/auth/me',
};
