import axiosInstance from './axiosInstance';
import { PAYMENT_ROUTES } from './config';

export class ApiRequestError extends Error {
  constructor(error) {
    super(error?.response?.data?.message || error?.message || 'API request failed');
    this.name = 'ApiRequestError';
    this.status = error?.response?.status ?? null;
    this.errors = error?.response?.data?.errors ?? [];
    this.response = error?.response ?? null;
  }
}

function buildAuthHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function extractResponseData(res) {
  const raw = res?.data ?? res;
  return raw?.data ?? raw;
}

export const STRIPE_TEST_CARD = {
  cardNumber: '4242424242424242',
  cvv: '123',
  expMonth: 12,
  expYear: 2030,
};

export const formatStorePrice = (amount, locale = 'nl-NL', currency = 'EUR') => {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
};

export const getStoreConfig = async () => {
  try {
    const res = await axiosInstance.get(PAYMENT_ROUTES.storeConfig);
    const data = extractResponseData(res);
    return data?.store ?? data;
  } catch (error) {
    throw new ApiRequestError(error);
  }
};

export const getOrderPaymentSummary = async (orderId, token) => {
  try {
    const res = await axiosInstance.get(PAYMENT_ROUTES.orderSummary(orderId), {
      headers: buildAuthHeaders(token),
    });
    const data = extractResponseData(res);
    return data?.summary ?? data;
  } catch (error) {
    throw new ApiRequestError(error);
  }
};

export const createStripePaymentIntent = async (
  orderId,
  paymentMethodType = 'card',
  token,
) => {
  try {
    const res = await axiosInstance.post(
      PAYMENT_ROUTES.createIntent(orderId),
      { paymentMethodType },
      {
        headers: buildAuthHeaders(token),
      },
    );
    const data = extractResponseData(res);
    return data;
  } catch (error) {
    throw new ApiRequestError(error);
  }
};

export const confirmCardPayment = async (orderId, card, token) => {
  try {
    const payload = {
      cardNumber: String(card.cardNumber || '').replace(/\s+/g, ''),
      cvv: String(card.cvv || ''),
      expMonth: Number(card.expMonth),
      expYear: Number(card.expYear),
    };
    const res = await axiosInstance.post(
      PAYMENT_ROUTES.confirmPayment(orderId),
      payload,
      {
        headers: buildAuthHeaders(token),
      },
    );
    const data = extractResponseData(res);
    return data;
  } catch (error) {
    throw new ApiRequestError(error);
  }
};
