import axiosInstance from '../../axiosInstance';
import { USER_ROUTES } from '../../config';

/**
 * Customer login — POST /api/v1/auth/login
 * @param {{ email: string, password: string }} credentials
 */
export const loginUser = async (credentials) => {
  return await axiosInstance.post(USER_ROUTES.login, credentials);
};
