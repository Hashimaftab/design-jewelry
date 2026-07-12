import adminAxiosInstance from '../../adminAxiosInstance';
import { ADMIN_ROUTES } from '../../config';

/**
 * Admin login — POST /api/v1/admin/auth/login
 * @param {{ email: string, password: string }} credentials
 */
export const loginAdmin = async (credentials) => {
  return await adminAxiosInstance.post(ADMIN_ROUTES.login, credentials);
};
