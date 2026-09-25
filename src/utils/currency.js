// Store prices are euro amounts; this formats them without changing their value.
export function formatStorePrice(amount, locale = 'nl-NL') {
  const value = Number(amount);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(Number.isFinite(value) ? value : 0);
}
