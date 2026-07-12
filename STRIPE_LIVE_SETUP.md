# Stripe — Live payments setup for husnx.com

Payments use **Stripe.js Payment Element** (PCI-safe). Card numbers never pass through your server.

## 1. Stripe Dashboard — activate Live mode

1. [dashboard.stripe.com](https://dashboard.stripe.com) → complete **Business** profile (legal name, address, website `https://husnx.com`)
2. **Settings → Payouts** → add EUR bank account
3. Toggle **Test mode → Live mode** (top-right)
4. Wait for account **activation** (1–3 days)

## 2. Copy API keys

**Developers → API keys**

| Key | Example prefix | Where to set |
|-----|----------------|--------------|
| Publishable | `pk_live_...` | Vercel → `VITE_STRIPE_PUBLISHABLE_KEY` |
| Secret | `sk_live_...` | Railway → `STRIPE_SECRET_KEY` |

For testing before Live activation, use **Test mode** keys (`pk_test_...` / `sk_test_...`) on both platforms.

**Never** commit secret keys or put `sk_live_...` in the frontend.

## 3. Live webhook (required)

**Developers → Webhooks → Add endpoint** (or use Stripe CLI in test mode):

```bash
stripe webhook_endpoints create \
  --url "https://api.husnx.com/api/v1/payments/webhook/stripe" \
  --enabled-events payment_intent.succeeded \
  --enabled-events payment_intent.payment_failed \
  --enabled-events payment_intent.canceled
```

Copy the returned **Signing secret** `whsec_...` → Railway → `STRIPE_WEBHOOK_SECRET`

**Test mode webhook is already configured** for `api.husnx.com`. When you switch to Live mode, create a **new Live webhook** with the same URL and update Railway with the new `whsec_...`.

Redeploy the Railway **api** service after saving.

## 4. Vercel environment variables

**Settings → Environment Variables → Production**

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

(Use `pk_test_...` while testing.)

Redeploy frontend after saving.

## 5. Railway environment variables

**api** service → **Variables**

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 6. Test flow

| Step | Keys | Action |
|------|------|--------|
| 1 | Test | Checkout on husnx.com → Stripe Payment Element → card `4242 4242 4242 4242` |
| 2 | Test | Stripe Dashboard → Webhooks → event delivered (200) |
| 3 | Live | One small real order → refund in Stripe if needed |

## 7. Verify

- Payment page shows **Stripe-hosted** fields (not custom card inputs)
- Network tab: no `cardNumber` sent to `api.husnx.com`
- Order status becomes `paid` after payment
- `POST /payments/orders/:id/confirm` returns **410** in production (raw cards disabled)

## Local development

```env
# .env (frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# .env (backend) — already set
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from: npm run stripe:webhook locally
```

Run backend + `npm run dev` frontend. Use test card in Payment Element.
