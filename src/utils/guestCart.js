const CART_KEY = 'husan_guest_cart';
export function buildGuestCart(items) {
  const lines = items.map((item) => ({ ...item, lineTotal: Math.round(Number(item.product?.price || 0) * item.quantity * 100) / 100 }));
  return { items: lines, itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: Math.round(lines.reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100 };
}
export function readGuestCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return buildGuestCart(Array.isArray(saved) ? saved.filter((line) => line && typeof line.productId === 'string' && line.product && Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 100).slice(0, 100) : []);
  } catch { return buildGuestCart([]); }
}
export function writeGuestCart(items) {
  if (items.length > 100) throw new Error('Your bag can contain at most 100 different items.');
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  return buildGuestCart(items);
}
