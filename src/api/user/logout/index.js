import axiosInstance from '../../axiosInstance';
import { USER_ROUTES } from '../../config';

/**
 * Customer logout — POST /api/v1/auth/logout
 * @param {string} refreshToken
 */
export const logoutUser = async (refreshToken) => {
  return await axiosInstance.post(USER_ROUTES.logout, { refreshToken });
};
