import assert from 'node:assert/strict';
import test from 'node:test';
import { getAdminOrdersPage, getOrderLabel, getOrderCustomerName, formatOrderAmount } from '../src/utils/adminOrderHelpers.js';

const order = {
  id: 'b73e22b0-fdf1-4a54-9c16-37c093e7bea6',
  status: 'placed',
  shippingStatus: 'pending',
  paymentStatus: 'paid',
  createdAt: '2026-09-08T23:45:05.000Z',
  currencyCode: 'eur',
  customer: { firstName: 'Hashim', lastName: 'Aftab', email: 'customer@example.com' },
  totalAmount: 24,
  grandTotalAmount: 24,
  items: [{ productName: 'Ring', quantity: 2, unitPrice: 12, lineTotal: 24 }],
};

test('API fields identify customer, amount, and shipping independently of placed status', () => {
  assert.equal(getOrderCustomerName(order), 'Hashim Aftab');
  assert.equal(getOrderLabel(order), '#B73E22B0');
  assert.match(formatOrderAmount(order.grandTotalAmount, order.currencyCode), /24,00/);
  const page = getAdminOrdersPage([order], { status: 'pending' });
  assert.equal(page.orders[0], order);
  assert.equal(page.statistics.pending_orders, 1);
  assert.equal(page.statistics.total_revenue, 24);
  assert.equal(getAdminOrdersPage([order], { status: 'placed' }).total_items, 0);
});

test('search matches names, email, full IDs, and displayed IDs without changing global counts', () => {
  for (const search of ['hashim aftab', 'CUSTOMER@', order.id, '#B73E22B0']) {
    assert.equal(getAdminOrdersPage([order], { search }).total_items, 1);
  }
  const empty = getAdminOrdersPage([order], { search: 'missing' });
  assert.equal(empty.total_items, 0);
  assert.equal(empty.statistics.total_orders, 1);
});

test('pagination handles more than 15 records and clamps a page after filtering', () => {
  const orders = Array.from({ length: 17 }, (_, i) => ({ ...order, id: String(i) }));
  const page = getAdminOrdersPage(orders, { page: 2, limit: 15 });
  assert.equal(page.total_pages, 2);
  assert.equal(page.orders.length, 2);
  assert.equal(page.orders[0].id, '15');
  assert.equal(page.statistics.total_orders, 17);
  const filtered = getAdminOrdersPage(orders, { page: 2, search: '16' });
  assert.equal(filtered.current_page, 1);
  assert.equal(filtered.orders.length, 1);
});

test('revenue includes only paid orders and preserves a zero grand total', () => {
  const orders = [order, { ...order, paymentStatus: 'pending' }, { ...order, grandTotalAmount: 0 }];
  assert.equal(getAdminOrdersPage(orders).statistics.total_revenue, 24);
  assert.match(formatOrderAmount(0, 'eur'), /0,00/);
  assert.equal(formatOrderAmount(undefined), '—');
  assert.equal(getOrderCustomerName({ customer: null }), 'Guest Customer');
  assert.deepEqual(getAdminOrdersPage([]).orders, []);
});
