import adminAxiosInstance from '../../adminAxiosInstance';
import { ADMIN_ROUTES } from '../../config';

/**
 * Admin profile — GET /api/v1/admin/auth/me
 */
export const getMeAdmin = async () => {
  return await adminAxiosInstance.get(ADMIN_ROUTES.me);
};
