import axiosInstance from '../../axiosInstance';
import { USER_ROUTES } from '../../config';

/**
 * Customer profile — GET /api/v1/auth/me
 */
export const getMeUser = async () => {
  return await axiosInstance.get(USER_ROUTES.me);
};
