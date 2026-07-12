# Stripe — Live payments setup for husnx.com

Payments use **Stripe.js Payment Element** (PCI-safe). Card numbers never pass through your server.

Supported methods: **iDEAL | Wero** (Dutch bank redirect) and **cards** (Visa, Mastercard, etc.).

## 0. Enable payment methods (do this first)

1. [dashboard.stripe.com](https://dashboard.stripe.com) → stay in **Test mode** while developing
2. **Settings → Payment methods** → enable:
   - **Cards**
   - **iDEAL** (co-branded **iDEAL | Wero** in 2026)
3. **Developers → API keys** → copy:
   - `pk_test_...` → Vercel `VITE_STRIPE_PUBLISHABLE_KEY`
   - `sk_test_...` → Railway `STRIPE_SECRET_KEY`

Redeploy both services after setting keys. Test with Payment Element on husnx.com before switching to Live mode.

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
| 2 | Test | Same flow → choose **iDEAL** test bank → redirect back to order success |
| 3 | Test | Stripe Dashboard → Webhooks → event delivered (200) |
| 4 | Live | One small real order (card or iDEAL) → refund in Stripe if needed |

## 7. Verify

- Payment page shows **Stripe-hosted** fields (not custom card inputs)
- Network tab: no `cardNumber` sent to `api.husnx.com`
- Order status becomes `paid` after payment
- `POST /payments/orders/:id/confirm` returns **410** in production (raw cards disabled)
- iDEAL | Wero tab appears in Payment Element (enable iDEAL in Stripe Dashboard)

### Automated checks (July 2026)

| Check | Status |
|-------|--------|
| `GET https://api.husnx.com/health` | 200 OK |
| `GET /api/v1/payments/store-config` | NL / EUR / 21% BTW |
| Vercel `VITE_STRIPE_PUBLISHABLE_KEY` set | Yes |
| Frontend deployed to husnx.com | Yes |
| Backend `allow_redirects: always` pushed | Yes — redeploy Railway if not auto-deployed |

### Manual E2E test (you run after Stripe keys are set)

1. Login on husnx.com → add item → checkout → payment page
2. **Card:** use `4242 4242 4242 4242` in Payment Element → order success
3. **iDEAL:** choose iDEAL test bank → redirect → order success (polls until webhook marks paid)
4. Stripe Dashboard → Webhooks → confirm 200 responses

## Local development

```env
# .env (frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# .env (backend) — already set
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from: npm run stripe:webhook locally
```

Run backend + `npm run dev` frontend. Use test card in Payment Element.
