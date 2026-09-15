/**
 * Customer (storefront) auth API — mounted at /api/v1/auth
 *
 * Set VITE_API_BASE_URL=http://localhost:3000/api/v1 in .env
 */

import axiosInstance from './axiosInstance';
import { USER_ROUTES } from './config';

export {
  getUserDisplayName,
  parseAuthResult,
  parseMeUser,
  parseTokenPair,
} from './authHelpers';
export { API_BASE_URL, USER_ROUTES, ADMIN_ROUTES } from './config';
export { refreshUserToken, refreshAdminToken } from './tokenRefresh';

// Re-export admin auth for convenience (canonical: admin/* modules or adminAuth.api.js)
export { loginAdmin, logoutAdmin, getMeAdmin } from './adminAuth.api';

/**
 * @typedef {'customer' | 'admin'} UserRole
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {UserRole} role
 * @property {boolean} isActive
 * @property {boolean} emailVerified
 * @typedef {Object} RegisterPayload
 * @property {string} email
 * @property {string} password
 * @property {string} firstName
 * @property {string} lastName
 * @typedef {Object} LoginPayload
 * @property {string} email
 * @property {string} password
 */

/** @param {RegisterPayload} payload */
export const registerUser = (payload) =>
  axiosInstance.post(USER_ROUTES.register, payload);

/** @param {LoginPayload} payload */
export const loginUser = (payload) => axiosInstance.post(USER_ROUTES.login, payload);

/** @param {string} refreshToken */
export const logoutUser = (refreshToken) =>
  axiosInstance.post(USER_ROUTES.logout, { refreshToken });

export const getMeUser = () => axiosInstance.get(USER_ROUTES.me);
