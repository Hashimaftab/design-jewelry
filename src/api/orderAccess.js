export function guestOrderToken(orderId) {
  return sessionStorage.getItem(`husan_order_${orderId}`);
}
export function orderHeaders(orderId, token) {
  const guestToken = guestOrderToken(orderId);
  return guestToken ? { 'X-Order-Token': guestToken } : token ? { Authorization: `Bearer ${token}` } : {};
}
