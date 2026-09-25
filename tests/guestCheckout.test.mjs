import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { checkoutPayload, prepareCheckoutAttempt, readCheckoutAttempt, clearCheckoutAttempt } from '../src/utils/checkoutAttempt.js';
import { readGuestCart, writeGuestCart } from '../src/utils/guestCart.js';
import { orderHeaders } from '../src/api/orderAccess.js';
import { getApiErrorMessage } from '../src/utils/adminAuth.js';
import { getAdminOrdersPage, getOrderCustomerName } from '../src/utils/adminOrderHelpers.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
}
beforeEach(() => {
  globalThis.localStorage = memoryStorage();
  globalThis.sessionStorage = memoryStorage();
});
const productId = 'e92f847c-547b-40f4-a381-9c5dd56085cc';
const items = [{ productId, quantity: 2, product: { price: 25, name: 'Necklace' }, lineTotal: 50 }];
const form = { fullName: ' Jane Doe ', email: 'jane@example.com', phone: '+31 (612) 345-678', addressLine1: 'Example Street 10', city: 'Amsterdam', postalCode: '1011AB', country: 'Netherlands', notes: 'Gift box' };

test('checkout sends only contract fields and preserves UUIDs', () => {
  const payload = checkoutPayload({ ...form, paymentMethod: 'ignored' }, items);
  assert.deepEqual(payload.items, [{ productId, quantity: 2 }]);
  assert.equal(payload.contact.fullName, 'Jane Doe');
  assert.deepEqual(Object.keys(payload).sort(), ['contact', 'items', 'notes']);
  assert.equal('paymentMethod' in payload.contact, false);
  for (const invalid of [1, '1', 'invalid']) assert.throws(() => checkoutPayload(form, [{ productId: invalid, quantity: 1 }]));
});

test('timeout and reload reuse full private request; edits and accounts get a new key', () => {
  const payload = checkoutPayload(form, items);
  const first = prepareCheckoutAttempt(payload);
  assert.deepEqual(prepareCheckoutAttempt(payload), first);
  assert.deepEqual(readCheckoutAttempt().payload, first);
  assert.equal(readCheckoutAttempt('customer'), null);
  assert.notEqual(prepareCheckoutAttempt({ ...payload, notes: 'Changed' }).checkoutKey, first.checkoutKey);
  const account = prepareCheckoutAttempt(payload, 'customer');
  assert.notEqual(account.checkoutKey, first.checkoutKey);
  clearCheckoutAttempt();
  assert.equal(readCheckoutAttempt('customer'), null);
});

test('required contact, phone, notes and quantity limits fail before submission', () => {
  for (const field of ['fullName', 'email', 'phone', 'addressLine1', 'city', 'postalCode', 'country']) assert.throws(() => checkoutPayload({ ...form, [field]: '' }, items));
  for (const phone of ['-------', '123456', '1234567+', '1234567abc']) assert.throws(() => checkoutPayload({ ...form, phone }, items));
  for (const quantity of [0, -1, 101, 1.5, '2']) assert.throws(() => checkoutPayload(form, [{ productId, quantity }]));
  assert.throws(() => checkoutPayload(form, []));
  assert.throws(() => checkoutPayload({ ...form, notes: 'a'.repeat(1001) }, items));
});

test('guest bag survives reload with estimated totals and handles corrupt storage', () => {
  writeGuestCart(items);
  assert.equal(readGuestCart().subtotal, 50);
  assert.equal(readGuestCart().itemCount, 2);
  assert.equal(readGuestCart().items[0].productId, productId);
  localStorage.setItem('husan_guest_cart', '[null, {"quantity": -1}]');
  assert.equal(readGuestCart().items.length, 0);
  localStorage.setItem('husan_guest_cart', 'broken json');
  assert.equal(readGuestCart().items.length, 0);
});

test('guest order access is isolated and takes precedence over customer bearer', () => {
  sessionStorage.setItem('husan_order_order-1', 'private-guest-token');
  assert.deepEqual(orderHeaders('order-1', 'customer-token'), { 'X-Order-Token': 'private-guest-token' });
  assert.deepEqual(orderHeaders('order-2', 'customer-token'), { Authorization: 'Bearer customer-token' });
  assert.deepEqual(orderHeaders('order-2'), {});
});

test('validation details reach the buyer and admin searches guest contact snapshots', () => {
  assert.match(getApiErrorMessage({ response: { data: { message: 'Validation failed', errors: ['Not enough stock', 'Invalid phone'] } } }), /Not enough stock.*Invalid phone/);
  const order = { id: '1', contact: { fullName: 'Guest Name', email: 'guest@example.com', phone: '12345678' }, customer: { name: 'Old Name' } };
  assert.equal(getOrderCustomerName(order), 'Guest Name');
  for (const search of ['Guest Name', 'guest@example', '12345678']) assert.equal(getAdminOrdersPage([order], { search }).total_items, 1);
});
