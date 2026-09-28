export function getCurrentProductPrice(product) {
  if (!product) return 0;
  return Number(product.onSale ? product.salePrice : product.price) || 0;
}
