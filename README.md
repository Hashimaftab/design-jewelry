# Design Jewelry — Frontend

React + Vite storefront and admin panel for the Design Jewelry e-commerce platform.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` in `.env` to your backend (default: `http://localhost:3000/api/v1`).

## Production deployment (Vercel)

### 1. Connect GitHub

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import `Hashimaftab/design-jewelry`
3. Framework: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`

[`vercel.json`](vercel.json) is included for React Router SPA rewrites.

### 2. Environment variables

In Vercel → **Settings → Environment Variables** (Production):

| Variable | Example |
|----------|---------|
| `VITE_API_BASE_URL` | `https://api.yourdomain.com/api/v1` |
| `VITE_API_ORIGIN` | `https://api.yourdomain.com` |
| `VITE_FORCE_ABSOLUTE_UPLOADS` | `true` |

See [`.env.production.example`](.env.production.example). Redeploy after changing env vars.

### 3. Custom domain

In Vercel → **Project → Domains**:

- Add `yourdomain.com`
- Optionally add `www.yourdomain.com` (redirect to apex)

At your domain registrar, add the DNS records Vercel shows (typically):

| Type | Name | Value |
|------|------|-------|
| A | `@` | Vercel IP(s) |
| CNAME | `www` | `cname.vercel-dns.com` |

### 4. Verify

- Shop loads at `https://yourdomain.com`
- Product pages and images load
- Login, cart, checkout, and admin panel work

## Backend

The API lives in a separate repo. Deploy it first, then point this frontend at `https://api.yourdomain.com`.

See the backend repo `DEPLOYMENT.md` for Railway/Render setup and DNS for the `api` subdomain.
