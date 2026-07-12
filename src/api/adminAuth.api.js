/**
 * Admin auth API — mounted at /api/v1/admin/auth
 *
 * POST /admin/auth/login
 * POST /admin/auth/refresh-token
 * POST /admin/auth/logout
 * GET  /admin/auth/me
 */

import adminAxiosInstance from './adminAxiosInstance';
import { ADMIN_ROUTES } from './config';

export { ADMIN_ROUTES };

/** @param {{ email: string, password: string }} payload */
export const loginAdmin = (payload) =>
  adminAxiosInstance.post(ADMIN_ROUTES.login, payload);

/** @param {string} refreshToken */
export const logoutAdmin = (refreshToken) =>
  adminAxiosInstance.post(ADMIN_ROUTES.logout, { refreshToken });

export const getMeAdmin = () => adminAxiosInstance.get(ADMIN_ROUTES.me);
