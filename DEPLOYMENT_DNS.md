# Custom Domain DNS Setup

Replace `yourdomain.com` with your actual domain (e.g. `husanjewelry.com`).

## Current live URLs (before custom domain)

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://design-jewelry.vercel.app |
| Backend (Railway) | https://api-production-5699.up.railway.app |

After DNS is configured, use `yourdomain.com` and `api.yourdomain.com` instead.

---

## Step 1 — Frontend domain (Vercel)

1. Open [Vercel Dashboard](https://vercel.com) → **design-jewelry** → **Settings → Domains**
2. Add `yourdomain.com` and `www.yourdomain.com`
3. Vercel shows the exact DNS records to add at your registrar

Typical records:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `76.76.21.21` (use the IP(s) Vercel shows) |
| CNAME | `www` | `cname.vercel-dns.com` |

---

## Step 2 — API subdomain (Railway)

1. Open [Railway Dashboard](https://railway.com) → **design-jewelry-api** → **api** service → **Settings → Networking**
2. Add custom domain: `api.yourdomain.com`
3. Railway shows a CNAME target (e.g. `xxxx.up.railway.app`)

At your registrar:

| Type | Name | Value |
|------|------|-------|
| CNAME | `api` | `<railway-cname-target>` |

---

## Step 3 — Update environment variables

### Vercel (frontend)

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_API_ORIGIN=https://api.yourdomain.com
VITE_FORCE_ABSOLUTE_UPLOADS=true
```

Redeploy after saving.

### Railway (backend)

```env
APP_BASE_URL=https://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

Redeploy after saving.

---

## Step 4 — Stripe webhook (when using payments)

Stripe Dashboard → **Webhooks** → endpoint:

```
https://api.yourdomain.com/api/v1/payments/webhook/stripe
```

---

## Step 5 — Verify

- `https://yourdomain.com` — shop loads
- `https://api.yourdomain.com/health` — API healthy
- `https://api.yourdomain.com/api-docs` — Swagger
- Login and admin panel work without CORS errors

DNS propagation can take 5–30 minutes (sometimes up to 48 hours).
