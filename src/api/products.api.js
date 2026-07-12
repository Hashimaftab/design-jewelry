/**
 * Admin products API — /api/v1/admin/products/{category}
 *
 * Categories: necklaces | bracelets | earrings | rings
 */

import adminAxiosInstance from './adminAxiosInstance';
import { isValidCategory } from '../constants/productCategories';

export function productsBasePath(categorySlug) {
  if (!isValidCategory(categorySlug)) {
    throw new Error(`Invalid product category: ${categorySlug}`);
  }
  return `/admin/products/${categorySlug}`;
}

/**
 * @param {{
 *   name?: string,
 *   description?: string,
 *   price?: number,
 *   quantity?: number,
 *   isAvailable?: boolean,
 *   image?: File,
 * }} fields
 * @returns {FormData}
 */
export function buildProductFormData(fields) {
  const form = new FormData();
  const { name, description, price, quantity, isAvailable, image } = fields;

  if (name !== undefined) form.append('name', name);
  if (description !== undefined) form.append('description', description);
  if (price !== undefined) form.append('price', String(price));
  if (quantity !== undefined) form.append('quantity', String(Math.max(0, Math.floor(Number(quantity)))));
  if (isAvailable !== undefined) {
    form.append('isAvailable', isAvailable ? 'true' : 'false');
  }
  if (image instanceof File) form.append('image', image);

  return form;
}

/**
 * @param {string} categorySlug
 * @param {{ page?: number, limit?: number, search?: string }} [params]
 */
export const listProducts = (categorySlug, params = {}) =>
  adminAxiosInstance.get(productsBasePath(categorySlug), { params });

/**
 * @param {string} categorySlug
 * @param {string} productId
 */
export const getProduct = (categorySlug, productId) =>
  adminAxiosInstance.get(`${productsBasePath(categorySlug)}/${productId}`);

/**
 * @param {string} categorySlug
 * @param {FormData} formData
 */
export const createProduct = (categorySlug, formData) =>
  adminAxiosInstance.post(productsBasePath(categorySlug), formData);

/**
 * @param {string} categorySlug
 * @param {string} productId
 * @param {FormData} formData
 */
export const updateProduct = (categorySlug, productId, formData) =>
  adminAxiosInstance.put(`${productsBasePath(categorySlug)}/${productId}`, formData);

/**
 * @param {string} categorySlug
 * @param {string} productId
 */
export const deleteProduct = (categorySlug, productId) =>
  adminAxiosInstance.delete(`${productsBasePath(categorySlug)}/${productId}`);
