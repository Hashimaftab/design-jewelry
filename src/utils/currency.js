// Store prices are euro amounts; this formats them without changing their value.
const euroFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
});

export function formatStorePrice(amount) {
  const value = Number(amount);
  return euroFormatter.format(Number.isFinite(value) ? value : 0);
}
