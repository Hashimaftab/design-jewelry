import axios from 'axios';
import { API_BASE_URL, USER_ROUTES, ADMIN_ROUTES } from './config';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../constants/userAuth';
import {
  ADMIN_TOKEN_KEY,
  ADMIN_REFRESH_TOKEN_KEY,
} from '../constants/adminAuth';
import { parseTokenPair } from './authHelpers';

/** @param {string} refreshToken */
export async function refreshUserToken(refreshToken) {
  const { data } = await axios.post(
    `${API_BASE_URL}${USER_ROUTES.refreshToken}`,
    { refreshToken },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
  );

  const pair = parseTokenPair(data);
  if (pair?.accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, pair.accessToken);
  if (pair?.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, pair.refreshToken);

  return data;
}

/** @param {string} refreshToken */
export async function refreshAdminToken(refreshToken) {
  const { data } = await axios.post(
    `${API_BASE_URL}${ADMIN_ROUTES.refreshToken}`,
    { refreshToken },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
  );

  const pair = parseTokenPair(data);
  if (pair?.accessToken) localStorage.setItem(ADMIN_TOKEN_KEY, pair.accessToken);
  if (pair?.refreshToken) localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, pair.refreshToken);

  return data;
}
