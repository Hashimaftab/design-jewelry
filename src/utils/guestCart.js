import { getCurrentProductPrice } from './productPricing.js';

const CART_KEY = 'husan_guest_cart';
export function buildGuestCart(items) {
  const lines = items.map((item) => ({ ...item, lineTotal: Math.round(getCurrentProductPrice(item.product) * item.quantity * 100) / 100 }));
  return { items: lines, itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: Math.round(lines.reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100 };
}
function readCartStorage() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(saved) ? { items: saved, completedOrders: [] } : {
      items: Array.isArray(saved?.items) ? saved.items : [],
      completedOrders: Array.isArray(saved?.completedOrders) ? saved.completedOrders : [],
    };
  } catch { return { items: [], completedOrders: [] }; }
}
export function readGuestCart() {
  try {
    const saved = readCartStorage().items;
    return buildGuestCart(Array.isArray(saved) ? saved.filter((line) => line && typeof line.productId === 'string' && line.product && Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 100).slice(0, 100) : []);
  } catch { return buildGuestCart([]); }
}
export function writeGuestCart(items) {
  if (items.length > 100) throw new Error('Your bag can contain at most 100 different items.');
  const stored = readCartStorage();
  const next = items.map(item => ({ ...item, addedAt: item.addedAt || new Date().toISOString() }));
  localStorage.setItem(CART_KEY, JSON.stringify({ ...stored, items: next }));
  return buildGuestCart(next);
}

// Cart contents and completed order IDs are stored together, so revisiting the
// success page cannot subtract the same purchase a second time.
export function completeGuestOrder(order) {
  const stored = readCartStorage();
  if (order?.paymentStatus !== 'paid' || !order.id || !Array.isArray(order.items) || stored.completedOrders.includes(order.id)) return readGuestCart();
  const purchased = new Map();
  for (const item of order.items) purchased.set(item.productId, (purchased.get(item.productId) || 0) + item.quantity);
  const items = readGuestCart().items.map(item => ({
    ...item,
    quantity: item.addedAt && order.createdAt && new Date(item.addedAt) > new Date(order.createdAt)
      ? item.quantity : Math.max(0, item.quantity - (purchased.get(item.productId) || 0)),
  })).filter(item => item.quantity > 0);
  localStorage.setItem(CART_KEY, JSON.stringify({ items, completedOrders: [...stored.completedOrders, order.id] }));
  return buildGuestCart(items);
}
