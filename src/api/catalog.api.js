/**
 * Public storefront catalog — no auth required
 * GET /api/v1/products/{necklaces|bracelets|earrings|rings}
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
 * @param {'necklaces'|'bracelets'|'earrings'|'rings'} categorySlug
 * @param {{ page?: number, limit?: number, search?: string, inStockOnly?: boolean }} [params]
 */
export const listCatalogProducts = async (categorySlug, params = {}) => {
  const query = { ...params };
  if (query.inStockOnly) {
    query.inStockOnly = true;
  }
  const res = await axiosInstance.get(CATALOG_ROUTES.list(categorySlug), { params: query });
  return parseListResponse(res);
};

/**
 * @param {'necklaces'|'bracelets'|'earrings'|'rings'} categorySlug
 * @param {string} productId
 */
export const getCatalogProduct = async (categorySlug, productId) => {
  const res = await axiosInstance.get(CATALOG_ROUTES.detail(categorySlug, productId));
  return parseProductResponse(res);
};
