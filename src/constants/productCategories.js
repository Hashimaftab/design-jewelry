/** Canonical collection slugs (match URLs `/collections/:category` and product.category). */
export const PRODUCT_CATEGORIES = [
  { slug: 'necklaces', label: 'Necklaces' },
  { slug: 'earrings', label: 'Earrings' },
  { slug: 'rings', label: 'Rings' },
  { slug: 'bracelets', label: 'Bracelets' },
];

const SLUG_SET = new Set(PRODUCT_CATEGORIES.map((c) => c.slug));

export const isValidCategory = (slug) => typeof slug === 'string' && SLUG_SET.has(slug);

export const getCategoryLabel = (slug) =>
  PRODUCT_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;

/** API `category` field (singular) → URL slug */
export const CATEGORY_DB_TO_SLUG = {
  necklace: 'necklaces',
  bracelet: 'bracelets',
  earring: 'earrings',
  ring: 'rings',
};

export const CATEGORY_SLUG_TO_DB = {
  necklaces: 'necklace',
  bracelets: 'bracelet',
  earrings: 'earring',
  rings: 'ring',
};
