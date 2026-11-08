import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createElement, useContext } from 'react';
import { renderToString } from 'react-dom/server';
import { readGuestCart, writeGuestCart, completeGuestOrder } from '../src/utils/guestCart.js';
import { prepareCheckoutAttempt, readCheckoutAttempt, rememberCheckoutOrder, clearCheckoutAttempt } from '../src/utils/checkoutAttempt.js';

beforeEach(() => {
  const storage = () => { const values = new Map(); return { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,String(v)), removeItem: k => values.delete(k) }; };
  globalThis.localStorage = storage(); globalThis.sessionStorage = storage();
});
const line = (id, quantity) => ({ productId:id, quantity, product:{price:10}, addedAt:'2026-01-01T00:00:00Z' });
const order = { id:'order-1', paymentStatus:'paid', createdAt:'2026-01-02T00:00:00Z', items:[{productId:'ring',quantity:2}] };

test('pending, failed and abandoned payments preserve the persistent guest bag', () => {
  writeGuestCart([line('ring',2)]);
  for (const paymentStatus of ['pending','requires_payment','failed','processing',undefined]) {
    completeGuestOrder({...order,paymentStatus});
    assert.equal(readGuestCart().itemCount,2);
  }
});
test('paid orders remove purchased quantities once and preserve later additions', () => {
  writeGuestCart([line('ring',3),line('necklace',1)]);
  assert.equal(completeGuestOrder(order).itemCount,2);
  assert.equal(readGuestCart().items.find(i=>i.productId==='ring').quantity,1);
  completeGuestOrder(order);
  assert.equal(readGuestCart().itemCount,2,'Reloading success does not clear new purchases');
  writeGuestCart([...readGuestCart().items,line('earrings',1)]);
  completeGuestOrder(order);
  assert.equal(readGuestCart().itemCount,3,'Cart updates preserve completion receipts');
});
test('an item removed and re-added after checkout is preserved', () => {
  writeGuestCart([{...line('ring',2),addedAt:'2026-01-03T00:00:00Z'}]);
  assert.equal(completeGuestOrder(order).itemCount,2);
});
test('legacy bags remain readable and an exact paid purchase empties the bag', () => {
  localStorage.setItem('husan_guest_cart',JSON.stringify([line('ring',2)]));
  assert.equal(readGuestCart().itemCount,2);
  assert.equal(completeGuestOrder(order).itemCount,0);
});
test('going back from payment reuses checkout and paying an older order preserves a newer attempt', () => {
  const payload={contact:{fullName:'Buyer'},items:[{productId:'ring',quantity:2}]};
  const first=prepareCheckoutAttempt(payload);
  rememberCheckoutOrder(order.id);
  assert.equal(prepareCheckoutAttempt(payload).checkoutKey,first.checkoutKey);
  clearCheckoutAttempt('different-order');
  assert.equal(readCheckoutAttempt().orderId,order.id);
  clearCheckoutAttempt(order.id);
  assert.equal(readCheckoutAttempt(),null);
});

test('cart provider retains the bag when creating an order and only settles a server-confirmed payment', async () => {
  const server = await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
  globalThis.window = {dispatchEvent:()=>{}};
  try {
    const {CartProvider}=await server.ssrLoadModule('/src/context/CartContext.jsx');
    const {CartContext}=await server.ssrLoadModule('/src/context/CartContextValue.js');
    const {AuthContext}=await server.ssrLoadModule('/src/context/AuthContextValue.js');
    const {LanguageContext}=await server.ssrLoadModule('/src/context/LanguageContextValue.js');
    const {default:client}=await server.ssrLoadModule('/src/api/axiosInstance.js');
    let api; let paymentStatus='pending';
    client.defaults.adapter=async config=>({status:200,statusText:'OK',headers:{},config,data:{success:true,data:{order:{...order,paymentStatus},guestOrderToken:'fixture-order-access'}}});
    function Probe(){api=useContext(CartContext);return null;}
    writeGuestCart([line('ring',3),line('necklace',1)]);
    renderToString(createElement(AuthContext.Provider,{value:{token:null}},createElement(LanguageContext.Provider,{value:{t:key=>key}},createElement(CartProvider,null,createElement(Probe)))));
    assert.equal((await api.placeOrder({items:order.items})).success,true);
    assert.equal(readGuestCart().itemCount,4,'Order creation must retain the bag');
    await api.completePaidOrder(order.id);
    assert.equal(readGuestCart().itemCount,4,'Pending server status must retain the bag');
    paymentStatus='paid';
    await api.completePaidOrder(order.id);
    assert.equal(readGuestCart().itemCount,2,'Paid confirmation removes purchased quantities');
    await api.completePaidOrder(order.id);
    assert.equal(readGuestCart().itemCount,2);
  } finally {await server.close();delete globalThis.window;}
});
