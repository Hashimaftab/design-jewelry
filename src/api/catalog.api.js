/**
 * Public storefront catalog — no auth required
 * GET /api/v1/products/{necklaces|bracelets|earrings|rings|gifts}
 */

import axiosInstance from './axiosInstance';
import { API_BASE_URL, CATALOG_ROUTES } from './config';
import { parseListResponse, parseProductResponse } from '../utils/productHelpers';

export class ApiRequestError extends Error {
  constructor(error) {
    super(error?.message || 'API request failed');
    this.name = 'ApiRequestError';
    this.statusCode = error?.response?.status ?? null;
    this.errors = error?.response?.data?.errors ?? [];
    this.response = error?.response ?? null;
    this.original = error;
  }
}

export { CATALOG_ROUTES };

export const CATALOG_ENDPOINTS = {
  list: (categorySlug) => `${API_BASE_URL}${CATALOG_ROUTES.list(categorySlug)}`,
  detail: (categorySlug, productId) => `${API_BASE_URL}${CATALOG_ROUTES.detail(categorySlug, productId)}`,
};

/**
 * All categories combined, newest first.
 * @param {{ page?: number, limit?: number, search?: string, locale?: 'nl'|'en' }} [params]
 */
export const listAllCatalogProducts = async (params = {}) => {
  const res = await axiosInstance.get(CATALOG_ROUTES.all, { params });
  return parseListResponse(res);
};

/**
 * @param {'necklaces'|'bracelets'|'earrings'|'rings'|'gifts'} categorySlug
 * @param {{ page?: number, limit?: number, search?: string, locale?: 'nl'|'en' }} [params]
 */
export const listCatalogProducts = async (categorySlug, params = {}) => {
  const res = await axiosInstance.get(CATALOG_ROUTES.list(categorySlug), { params });
  return parseListResponse(res);
};

/**
 * @param {'necklaces'|'bracelets'|'earrings'|'rings'|'gifts'} categorySlug
 * @param {string} productId
 * @param {{ locale?: 'nl'|'en' }} [params]
 */
export const getCatalogProduct = async (categorySlug, productId, params = {}) => {
  const res = await axiosInstance.get(CATALOG_ROUTES.detail(categorySlug, productId), { params });
  return parseProductResponse(res);
};
