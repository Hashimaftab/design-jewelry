import adminAxiosInstance from '../../adminAxiosInstance';
import { ADMIN_ROUTES } from '../../config';

/**
 * Admin logout — POST /api/v1/admin/auth/logout
 * Requires Bearer access token + refreshToken in body.
 * @param {string} refreshToken
 */
export const logoutAdmin = async (refreshToken) => {
  return await adminAxiosInstance.post(ADMIN_ROUTES.logout, { refreshToken });
};
