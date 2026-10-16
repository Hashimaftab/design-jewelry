import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

export function useCheckoutQuote(cart) {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify({
    items: cart.items.map(({ productId, quantity }) => ({ productId, quantity })),
    subtotal: cart.subtotal,
    attempt,
  });
  useEffect(() => {
    const { items } = JSON.parse(key);
    if (!items.length) return undefined;
    let cancelled = false;
    axiosInstance.post('/orders/quote', { items }, { skipCustomerAuth: true, timeout: 15000 })
      .then((response) => {
        const quote = response.data?.quote;
        if (!quote || !Number.isFinite(quote.grandTotalAmount)) throw new Error('Invalid checkout totals');
        if (!cancelled) setResult({ key, quote });
      })
      .catch(() => {
        if (!cancelled) setResult({ key, error: true });
      });
    return () => { cancelled = true; };
  }, [key]);
  // Hide a previous quote immediately when quantities change, even before the effect runs.
  return {
    quote: result?.key === key ? result.quote : null,
    quoteError: result?.key === key && result.error,
    retryQuote: () => setAttempt((value) => value + 1),
  };
}
