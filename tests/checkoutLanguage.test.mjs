import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutPayload, prepareCheckoutAttempt, readCheckoutAttempt } from '../src/utils/checkoutAttempt.js';
import { translations } from '../src/i18n/translations.js';
import { createServer } from 'vite';
import { createElement, useContext } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

test('Dutch and English orders retain language across checkout retries', () => {
  const saved = new Map();
  globalThis.sessionStorage = {getItem:key=>saved.get(key)??null, setItem:(key,value)=>saved.set(key,value)};
  const form = {fullName:'Test Buyer',email:'test@example.com',phone:'123456789',addressLine1:'Test 1',city:'Amsterdam',postalCode:'1000AA',country:'Nederland'};
  const items = [{productId:'e92f847c-547b-40f4-a381-9c5dd56085cc',quantity:1}];
  const dutch = prepareCheckoutAttempt(checkoutPayload(form, items, 'nl'));
  assert.equal(readCheckoutAttempt().payload.contact.language, 'nl');
  assert.equal(prepareCheckoutAttempt(checkoutPayload(form, items, 'nl')).checkoutKey, dutch.checkoutKey);
  const english = prepareCheckoutAttempt(checkoutPayload(form, items, 'en'));
  assert.equal(english.contact.language, 'en');
  assert.notEqual(english.checkoutKey, dutch.checkoutKey);
});

test('payment and confirmation keys have explicit Dutch and English translations', () => {
  for (const key of Object.keys(translations.en).filter(key=>/^(payment|success)\./.test(key))) {
    assert.ok(translations.nl[key], `Missing Dutch translation: ${key}`);
    assert.ok(translations.en[key], `Missing English translation: ${key}`);
  }
  assert.match(translations.nl['success.title'], /bevestigd/i);
  assert.match(translations.en['success.title'], /confirmed/i);
});

test('payment and confirmation render the saved or redirect language, including unavailable storage', async () => {
  const server = await createServer({configFile:false,server:{middlewareMode:true},appType:'custom'});
  try {
    const {LanguageProvider} = await server.ssrLoadModule('/src/context/LanguageContext.jsx');
    const {LanguageContext} = await server.ssrLoadModule('/src/context/LanguageContextValue.js');
    const {AuthContext} = await server.ssrLoadModule('/src/context/AuthContextValue.js');
    const {CartContext} = await server.ssrLoadModule('/src/context/CartContextValue.js');
    const {default:Payment} = await server.ssrLoadModule('/src/pages/Payment.jsx');
    const {default:Confirmation} = await server.ssrLoadModule('/src/pages/OrderSuccess.jsx');
    let current;
    function Probe() { current = useContext(LanguageContext); return null; }
    for (const language of ['nl','en']) {
      for (const redirect of [false,true]) {
        const storage = new Map([['husan_storefront_language',redirect ? (language === 'nl' ? 'en':'nl') : language]]);
        globalThis.localStorage = {getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
        globalThis.window = {location:{origin:'https://husnx.com',href:`https://husnx.com/order-success/test${redirect ? `?lang=${language}`:''}`,search:redirect?`?lang=${language}`:''},history:{state:null,replaceState:()=>{}}};
        for (const [Page,key] of [[Payment,'payment.loading'],[Confirmation,'success.loading']]) {
          const markup = renderToString(createElement(MemoryRouter,null,
            createElement(LanguageProvider,null,createElement(Probe),
              createElement(AuthContext.Provider,{value:{token:null}},
                createElement(CartContext.Provider,{value:{completePaidOrder:async()=>{}}},createElement(Page))))));
          assert.equal(current.language, language);
          assert.ok(markup.includes(translations[language][key]));
          assert.equal(storage.get('husan_storefront_language'),language);
        }
      }
    }
    globalThis.localStorage = {getItem:()=>{throw Error('Storage blocked');},setItem:()=>{throw Error('Storage blocked');}};
    globalThis.window.location.search = '?lang=en';
    renderToString(createElement(LanguageProvider,null,createElement(Probe)));
    assert.equal(current.language,'en');
    assert.doesNotThrow(()=>current.setLanguage('nl'));
  } finally {await server.close();delete globalThis.window;}
});
