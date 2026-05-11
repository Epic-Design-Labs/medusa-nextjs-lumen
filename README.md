<div align="center">

# Lumen Starter

A modern **Next.js storefront starter for [Medusa](https://medusajs.com)**.
Deploys natively to **Medusa Cloud** or **Vercel** — same code, same env vars.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Medusa](https://img.shields.io/badge/Medusa-v2-purple)](https://medusajs.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

**[🌍 Live demo](https://demo.medusanextjsstarter.com)** ·
**[📦 GitHub](https://github.com/Epic-Design-Labs/medusa-nextjs-lumen)** ·
Built by **[Epic Design Labs](https://epicdesignlabs.com)**

</div>

---

## Why Lumen exists

Most Medusa storefront starters today are tied to a single deploy target and a
single payment provider. Lumen makes both portable, with native Medusa
functionality wired end-to-end on day one.

- 🌐 **Cloud OR Vercel.** No platform-specific dependencies in critical paths.
  Set a backend URL and deploy anywhere Next.js runs.
- 💳 **Gateway-agnostic payments.** Stripe Elements and PayPal Smart Buttons
  ship in the box. Adding a new provider is one file.
- ✨ **Designed, not generated.** Built on Next.js 16, Tailwind v4, and
  shadcn/ui by a design agency that ships ecommerce for a living.
- 🔌 **Connector-friendly.** A clean repository + provider abstraction lets you
  layer in reviews, IMS, payment orchestrators, etc. without forking the theme.

---

## Live demo

**[demo.medusanextjsstarter.com](https://demo.medusanextjsstarter.com)**

The demo runs against a real Medusa Cloud backend. Try the full flow:

1. Browse `/us/shop` — products served straight from Medusa
2. Add to cart, apply a promo code, see Medusa-computed totals
3. Switch to `/gb` for EUR pricing in the same UI
4. Place a real test order (uses Medusa's `pp_system_default` provider, no charge)
5. Register, log in, view your order history

---

## Quick start

Requires **Node.js 20+** and a running Medusa v2 backend.

```bash
git clone https://github.com/Epic-Design-Labs/medusa-nextjs-lumen.git
cd medusa-nextjs-lumen
cp .env.example .env.local
# Fill in your backend URL + publishable key
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Need a Medusa backend?

| Path | Best for | How |
|---|---|---|
| **Medusa Cloud** | Fastest start | Sign up at [cloud.medusajs.com](https://cloud.medusajs.com), clone a starter, grab the backend URL + publishable key from your admin |
| **Self-host** | Full control | Follow the [Medusa installation guide](https://docs.medusajs.com/learn/installation) and point Lumen at `http://localhost:9000` |

---

## Environment variables

**Required**:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Your Medusa backend (e.g. `https://your-store.medusajs.app`) |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Publishable API key from your Medusa admin |

**Optional**:

| Variable | Default | Notes |
|---|---|---|
| `NEXT_PUBLIC_DEFAULT_REGION` | `us` | ISO-2 country fallback when no region is in URL/cookie |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` | Storefront origin for canonical URLs + OG tags |
| `NEXT_PUBLIC_STRIPE_KEY` | — | Required only if Stripe is enabled on your Medusa backend |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | — | Required only if PayPal is enabled on your Medusa backend |

> ⚠️ **All `NEXT_PUBLIC_*` vars must be exposed at BUILD time** on Cloud and Vercel.
> Next.js compiles them into the client bundle; setting them as Runtime-only
> won't work.

See [`.env.example`](.env.example) for the full annotated list.

---

## What's in the box

### Native Medusa features (wired end-to-end)

| | |
|---|---|
| **Catalog** | Products, variants, options, categories, collections, brands (derived from product type), full-text search |
| **Regions** | Multi-country, multi-currency, region-driven pricing and tax, country detection from CDN headers + cookies |
| **Cart** | Line items, quantity controls, promotion codes, gift cards (same mechanism), server-computed totals |
| **Checkout** | Address → shipping option → payment session → order completion, multi-step UI |
| **Payments** | Stripe Elements, PayPal Smart Buttons, manual `system_default`, generic fallback for any future provider |
| **Customer** | Register, login, logout, forgot/reset password |
| **Account** | Orders list, order detail, customer-initiated returns, addresses (CRUD + default), profile |

### Storefront polish

- Wishlist + recently viewed (localStorage)
- ⌘K search modal with debounced server-side query
- Dismissible announcement bar
- Mobile-first responsive design
- Full accessibility (WCAG AA): focus management, ARIA, skip-to-content, 44px touch targets
- SEO: dynamic metadata, Open Graph, canonical URLs, multi-region sitemap, robots.txt, JSON-LD
- Security headers: CSP, HSTS, X-Frame-Options, Permissions-Policy
- i18n via next-intl (English + Spanish)

---

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FEpic-Design-Labs%2Fmedusa-nextjs-lumen&env=NEXT_PUBLIC_MEDUSA_BACKEND_URL,NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY&envDescription=Required%20Medusa%20backend%20configuration.%20Find%20these%20in%20your%20Medusa%20Admin.&envLink=https%3A%2F%2Fgithub.com%2FEpic-Design-Labs%2Fmedusa-nextjs-lumen%23environment-variables)

1. Click the button above (or `vercel deploy` from CLI)
2. Set env vars in Project Settings → Environment Variables — check **Build** and **Runtime** for every `NEXT_PUBLIC_*`
3. Add your domain in Project Settings → Domains (optional)

### Deploy to Medusa Cloud

If your Medusa backend already runs on Cloud:

1. Push this repo to GitHub
2. In Cloud → your project → **Connect storefront** to this repo
3. Set the env vars on the **Storefront environment** (Build + Runtime both ON)
4. Cloud builds and serves the storefront on `<subdomain>.medusajs.site`

The backend can live anywhere — Medusa Cloud, Railway, Render, AWS, your own
infrastructure. Lumen only needs the HTTP URL.

---

## Project structure

```
src/
  app/
    (store)/[countryCode]/      # All storefront routes, region-scoped
      [slug]/                   # Product / category / collection / brand router
      cart/                     # Cart page
      checkout/                 # Multi-step checkout
      account/                  # Customer dashboard
        orders/[id]/            # Order detail + return request
        addresses/, settings/
      auth/                     # login, register, forgot/reset password
    sitemap.ts                  # Per-region URLs for every product
    robots.ts
  proxy.ts                      # Country detection, region redirect, security headers
  components/
    layout/                     # Header, Footer, AnnouncementBar
    cart/                       # CartDrawer, CartItem, PromotionCodeForm
    checkout/                   # PaymentProviderInput (Stripe + PayPal + extensible)
    products/                   # ProductCard, Grid, Gallery, etc.
    ui/                         # shadcn/ui primitives
  lib/
    medusa.ts                   # @medusajs/js-sdk client (env-driven)
    cart-client.ts              # Cart + checkout + payment operations
    auth-client.ts              # register, login, password reset
    customer-client.ts          # orders, addresses, returns, profile
    repositories/               # Pluggable data access layer (swap for CMS, etc.)
  hooks/
    use-country-link.ts         # Region-aware <Link> hrefs
    use-auth-guard.ts           # Account-page guard
  store/                        # Zustand UI state (cart drawer, wishlist)
  types/                        # Backend-agnostic data contract
messages/
  en.json, es.json              # i18n strings
```

---

## Adding a payment provider

Lumen's payment layer is provider-agnostic. To add a new Medusa payment provider
to the storefront:

1. Install the provider on the Medusa backend (admin → Settings → Regions)
2. Set any required `NEXT_PUBLIC_*_KEY` env var on the storefront
3. Edit `src/components/checkout/payment-provider-input.tsx` and add one branch:

```tsx
if (props.providerId.startsWith("pp_your_provider")) {
  return <YourProviderPayment {...props} />
}
```

`<YourProviderPayment>` receives the active payment session (`session.data` has
whatever your provider populated: client secret, order ID, hosted URL, etc.),
renders the UI, and calls `onSubmit` after the provider's confirm step succeeds.

The cart/checkout flow doesn't change.

---

## Adding a CMS connector

Lumen treats blog posts + CMS pages as repository-pluggable. Out of the box
they're JSON-backed (see `src/data/blog.json` and `src/data/pages.json`). To
swap in a CMS:

1. Implement `BlogRepository` / `PageRepository` against your CMS API (Sanity,
   Strapi, Contentful, etc.)
2. Update `src/lib/repositories/index.ts` to re-export your implementation
3. No component changes

The same pattern works for any read-side data source (reviews, recommendations,
search providers).

---

## Contributing

Issues and PRs welcome at
[github.com/Epic-Design-Labs/medusa-nextjs-lumen](https://github.com/Epic-Design-Labs/medusa-nextjs-lumen/issues).

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style, and
release guidelines (coming soon).

---

## License

MIT — free for personal and commercial use. See [LICENSE](LICENSE).

---

## About

Lumen is designed and maintained by **[Epic Design Labs](https://epicdesignlabs.com)**,
a design and development studio that builds high-performing ecommerce
experiences. Need help launching on Medusa, customizing Lumen, or building a
private fork with deeper integrations? **[Get in touch](https://epicdesignlabs.com)**.
