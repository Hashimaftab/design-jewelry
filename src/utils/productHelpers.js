import { API_ORIGIN } from '../api/config';
import { CATEGORY_DB_TO_SLUG } from '../constants/productCategories';

/**
 * Extract /uploads/... path from a full or relative URL.
 * @param {string} url
 * @returns {string | null}
 */
function extractUploadPath(url) {
  try {
    const parsed = url.startsWith('/')
      ? new URL(url, API_ORIGIN)
      : new URL(url);
    if (parsed.pathname.startsWith('/uploads/')) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // ignore invalid URL
  }
  return null;
}

/**
 * Turn API image paths into browser-loadable URLs.
 *
 * Upload files are served from the API host (e.g. :3000) but the app runs on
 * Vite (:5173). Browsers may block cross-origin images (CORP). In dev we use
 * a relative /uploads path proxied by Vite (see vite.config.js).
 */
export function resolveImageUrl(url) {
  if (url == null) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';

  const uploadPath = extractUploadPath(trimmed);
  const forceAbsolute = import.meta.env.VITE_FORCE_ABSOLUTE_UPLOADS === 'true';

  if (uploadPath && !forceAbsolute) {
    return uploadPath;
  }

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;

  if (uploadPath) {
    const origin = API_ORIGIN.replace(/\/$/, '');
    return `${origin}${uploadPath}`;
  }

  const origin = API_ORIGIN.replace(/\/$/, '');
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${origin}${path}`;
}

function pickRawImageUrl(p) {
  return p.imageUrl ?? p.image_url ?? p.image ?? p.thumbnail ?? '';
}

/**
 * Normalize API product for admin UI.
 */
export function normalizeProduct(p) {
  if (!p || typeof p !== 'object') return null;

  const imageUrl = resolveImageUrl(pickRawImageUrl(p));
  const category = p.category ?? '';
  const categorySlug = CATEGORY_DB_TO_SLUG[category] ?? p.categorySlug ?? category;

  return {
    id: p.id,
    category,
    categorySlug,
    name: p.name ?? '',
    description: p.description ?? '',
    price: Number(p.price) || 0,
    imageUrl,
    image: imageUrl,
    quantity: Number(p.quantity) || 0,
    isAvailable: Boolean(p.isAvailable ?? p.is_available),
    inStock: Boolean(p.inStock ?? p.in_stock),
    createdAt: p.createdAt ?? p.created_at,
    updatedAt: p.updatedAt ?? p.updated_at,
  };
}

/**
 * @param {object} res — axios response or response.data
 */
export function parseProductResponse(res) {
  const data = res?.data ?? res;
  return normalizeProduct(data?.product);
}

/**
 * @param {object} res — axios response or response.data
 * @returns {{ products: object[], total: number, page: number, limit: number, totalPages: number }}
 */
export function parseListResponse(res) {
  const data = res?.data ?? res ?? {};
  const products = Array.isArray(data.products) ? data.products : [];
  const total = Number(data.total) || 0;
  const page = Number(data.page) || 1;
  const limit = Number(data.limit) || 20;
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;

  return {
    products: products.map(normalizeProduct).filter(Boolean),
    total,
    page,
    limit,
    totalPages,
  };
}
