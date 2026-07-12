import axiosInstance from '../../axiosInstance';
import { USER_ROUTES } from '../../config';

/**
 * Customer registration — POST /api/v1/auth/register
 * @param {{ email: string, password: string, firstName: string, lastName: string }} userData
 */
export const registerUser = async (userData) => {
  return await axiosInstance.post(USER_ROUTES.register, userData);
};
