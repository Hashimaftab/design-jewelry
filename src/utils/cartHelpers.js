import { normalizeProduct } from './productHelpers';

/**
 * @param {object} line — API cart line
 */
export function normalizeCartLine(line) {
  if (!line || typeof line !== 'object') return null;

  const product = line.product ? normalizeProduct(line.product) : null;

  return {
    productId: line.productId,
    quantity: Number(line.quantity) || 0,
    lineTotal: Number(line.lineTotal) || 0,
    product,
  };
}

/**
 * @param {object} res — axios response or response.data
 */
export function parseCartResponse(res) {
  const cart = res?.data?.cart ?? res?.cart ?? {};
  const items = Array.isArray(cart.items)
    ? cart.items.map(normalizeCartLine).filter(Boolean)
    : [];

  const itemCount =
    Number(cart.itemCount) || items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal =
    Number(cart.subtotal) || items.reduce((sum, i) => sum + i.lineTotal, 0);

  return { items, itemCount, subtotal };
}

/**
 * @param {object} res — axios response or response.data
 */
export function parseOrderResponse(res) {
  const order = res?.data?.order ?? res?.order;
  if (!order || typeof order !== 'object') return null;

  const items = Array.isArray(order.items)
    ? order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName ?? '',
        productCategory: item.productCategory ?? '',
        unitPrice: Number(item.unitPrice) || 0,
        quantity: Number(item.quantity) || 0,
        lineTotal: Number(item.lineTotal) || 0,
      }))
    : [];

  return {
    id: order.id,
    status: order.status,
    totalAmount: Number(order.totalAmount) || 0,
    items,
    createdAt: order.createdAt,
  };
}

/**
 * @param {object} res
 * @returns {ReturnType<parseOrderResponse>[]}
 */
export function parseOrdersListResponse(res) {
  const orders = res?.data?.orders;
  if (!Array.isArray(orders)) return [];

  return orders
    .map((order) =>
      parseOrderResponse({
        data: { order },
      }),
    )
    .filter(Boolean);
}
