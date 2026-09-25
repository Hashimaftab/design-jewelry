import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('checkout and payment API use one endpoint, save guest access, and isolate 401 handling', async () => {
  const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' });
  const makeStorage = () => {
    const values = new Map();
    return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
  };
  globalThis.localStorage = makeStorage();
  globalThis.sessionStorage = makeStorage();
  let unauthorizedEvents = 0;
  globalThis.window = { dispatchEvent: () => { unauthorizedEvents += 1; } };
  try {
    const { default: client } = await server.ssrLoadModule('/src/api/axiosInstance.js');
    const { checkoutCart, getMyOrder } = await server.ssrLoadModule('/src/api/cart.api.js');
    const { getOrderPaymentSummary, createStripePaymentIntent } = await server.ssrLoadModule('/src/api/payments.api.js');
    const { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } = await server.ssrLoadModule('/src/constants/userAuth.js');
    const { ADMIN_TOKEN_KEY } = await server.ssrLoadModule('/src/constants/adminAuth.js');
    localStorage.setItem(ADMIN_TOKEN_KEY, 'admin-must-not-be-used');
    const calls = [];
    let mode = 'success';
    const order = { id: 'test-order', paymentStatus: 'pending', contact: { email: 'test@example.com' }, items: [], grandTotalAmount: 66.45 };
    client.defaults.adapter = async config => {
      calls.push(config);
      if (mode === 'timeout') throw Object.assign(new Error('Network timeout'), { config });
      if (mode === '401') throw Object.assign(new Error('Unauthorized'), { config, response: { status: 401, data: { message: 'Order token expired' } } });
      const data = config.url.endsWith('/summary') ? { summary: order }
        : config.url.endsWith('/intent') ? { clientSecret: 'test-secret' }
          : { order, guestOrderToken: 'private-order-token' };
      return { status: 201, statusText: 'Created', headers: {}, config, data: { success: true, data } };
    };
    const payload = { checkoutKey: 'stable-checkout-key', contact: order.contact, items: [{ productId: 'e92f847c-547b-40f4-a381-9c5dd56085cc', quantity: 2 }] };
    assert.equal((await checkoutCart(payload)).id, order.id);
    assert.equal(calls[0].url, '/orders');
    assert.equal(calls[0].headers.Authorization, undefined);
    assert.deepEqual(JSON.parse(calls[0].data), payload);
    assert.equal(sessionStorage.getItem('husan_order_test-order'), 'private-order-token');
    localStorage.setItem(ACCESS_TOKEN_KEY, 'customer-token');
    localStorage.setItem(REFRESH_TOKEN_KEY, 'customer-refresh-token');
    assert.equal((await getMyOrder(order.id)).id, order.id);
    assert.equal((await getOrderPaymentSummary(order.id)).grandTotalAmount, 66.45);
    assert.equal((await createStripePaymentIntent(order.id)).clientSecret, 'test-secret');
    for (const call of calls.slice(1)) {
      assert.equal(call.headers['X-Order-Token'], 'private-order-token');
      assert.equal(call.headers.Authorization, undefined);
    }
    mode = '401';
    const before401 = calls.length;
    await assert.rejects(getOrderPaymentSummary(order.id), /Order token expired/);
    assert.equal(calls.length, before401 + 1, 'Guest 401 must not refresh or retry');
    assert.equal(unauthorizedEvents, 0);
    assert.equal(localStorage.getItem(ACCESS_TOKEN_KEY), 'customer-token');
    mode = 'timeout';
    const beforeTimeout = calls.length;
    await assert.rejects(checkoutCart(payload), /Network timeout/);
    assert.equal(calls.length, beforeTimeout + 1, 'No fallback checkout endpoint');
    mode = 'success';
    await checkoutCart(payload);
    assert.equal(calls.at(-1).headers.Authorization, 'Bearer customer-token');
    assert.deepEqual(JSON.parse(calls.at(-1).data), payload);
  } finally {
    await server.close();
    delete globalThis.window;
  }
});
