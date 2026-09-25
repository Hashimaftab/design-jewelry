export const CHECKOUT_ATTEMPT_KEY = 'husan_checkout_attempt';

export function readCheckoutAttempt(owner = 'guest') {
  try {
    const attempt = JSON.parse(sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY) || 'null');
    return attempt?.owner === owner && attempt.payload?.checkoutKey && attempt.payload?.contact
      ? attempt : null;
  } catch {
    return null;
  }
}

// Persist the entire request before sending it. A timeout must reuse the same key and body.
export function prepareCheckoutAttempt(payload, owner = 'guest') {
  const signature = JSON.stringify(payload);
  const saved = readCheckoutAttempt(owner);
  if (saved?.signature === signature) return saved.payload;
  const request = { ...payload, checkoutKey: crypto.randomUUID() };
  sessionStorage.setItem(CHECKOUT_ATTEMPT_KEY, JSON.stringify({ owner, signature, payload: request }));
  return request;
}

export function clearCheckoutAttempt() {
  sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
}

export function checkoutPayload(form, items) {
  const contact = {};
  for (const field of ['fullName', 'email', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country']) {
    contact[field] = String(form[field] || '').trim();
  }
  if (contact.fullName.length < 2 || contact.fullName.length > 200) throw new Error('Full name must contain 2–200 characters.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) || contact.email.length > 254) throw new Error('Please enter a valid email address.');
  if (!/^\+?[\d ()-]+$/.test(contact.phone) || contact.phone.length > 30 || contact.phone.replace(/\D/g, '').length < 7) throw new Error('Enter a valid phone number with at least 7 digits.');
  for (const [field, label, limit] of [['addressLine1', 'Street address', 255], ['city', 'City', 100], ['postalCode', 'Postal code', 30], ['country', 'Country', 100]]) {
    if (!contact[field] || contact[field].length > limit) throw new Error(`${label} is required and must be at most ${limit} characters.`);
  }
  if (contact.addressLine2.length > 255 || contact.state.length > 100) throw new Error('Apartment or state is too long.');
  const notes = String(form.notes || '').trim();
  if (notes.length > 1000) throw new Error('Notes must be at most 1,000 characters.');
  if (!items.length || items.length > 100) throw new Error('Your bag must contain 1–100 items.');
  const lines = items.map(({ productId, quantity }) => {
    if (typeof productId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) throw new Error('A product in your bag is unavailable. Remove it and add it again from the catalog.');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new Error('Each quantity must be between 1 and 100.');
    return { productId, quantity };
  });
  return { contact, notes, items: lines };
}
