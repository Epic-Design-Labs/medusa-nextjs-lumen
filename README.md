# Lumen

A modern Next.js storefront starter for **[Medusa](https://medusajs.com)**. Deploys natively to **Medusa Cloud** or **Vercel** — same code, same env vars.

Built by [Epic Design Labs](https://epicdesignlabs.com). MIT licensed.

> Lumen is the visible layer that wraps your Medusa backend — named for the unit of light, because that's what a storefront is: the part your customers actually see.

---

## Why Lumen

- **Medusa-native.** Built on Medusa v2's official JS SDK. Cart, checkout, customer auth, regions, promotions, gift cards — all the native features, none of the rebuild.
- **Cloud or Vercel.** No platform-specific dependencies in critical paths. Set `NEXT_PUBLIC_MEDUSA_BACKEND_URL` and deploy anywhere Next.js runs.
- **Design-forward.** Built by a design agency. Modern visual system, full responsive design, real attention to detail.
- **Production-grade defaults.** SEO, accessibility, security headers, i18n, structured data, sitemap, robots.txt — all wired in.
- **Connector-friendly.** A clean repository layer that lets you swap in connectors (reviews, IMS, payment orchestrators, etc.) without forking the theme.

## Tech stack

- **Next.js 16** (App Router, React Server Components, Turbopack)
- **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui**
- **@medusajs/js-sdk** v2
- **Zustand** (client-side UI state — wishlist, recently viewed)
- **Zod** (validation)
- **next-intl** (i18n — English + Spanish out of the box)

## Quick start

Requires Node.js 20+ and a running Medusa v2 backend.

```bash
git clone https://github.com/Epic-Design-Labs/medusa-nextjs-lumen.git
cd medusa-nextjs-lumen
cp .env.example .env.local
# Edit .env.local — fill in your backend URL + publishable key
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Where do I get a Medusa backend?

Two paths:

1. **Medusa Cloud** (recommended for quickstart) — sign up at [cloud.medusajs.com](https://cloud.medusajs.com), clone a starter, copy the backend URL and a publishable key from your admin into `.env.local`.
2. **Self-host** — follow Medusa's [installation guide](https://docs.medusajs.com/learn/installation). Point Lumen at `http://localhost:9000` for local dev.

## Required environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Your Medusa backend (e.g. `https://your-store.medusajs.app`) |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Publishable API key from your Medusa admin |

Optional: `NEXT_PUBLIC_DEFAULT_REGION` (ISO-2, default `us`), `NEXT_PUBLIC_BASE_URL` (storefront origin for canonical URLs), `NEXT_PUBLIC_STRIPE_KEY` (only if using Stripe).

See [`.env.example`](.env.example) for the full annotated list.

## Features

### Native Medusa support
- **Catalog** — products, variants, options (size/color/etc.), collections, categories, product types
- **Regions** — multi-country, multi-currency, region-driven pricing and tax
- **Cart** — line items, variant selection, promotion codes, gift cards
- **Checkout** — shipping address, shipping option, payment session, Stripe (default)
- **Customer auth** — register, login, forgot password
- **Account** — orders, order detail, addresses, profile, returns
- **Search** — server-side product search

### Storefront polish
- Wishlist (localStorage-persisted)
- Recently viewed
- Cmd+K search modal
- Dismissible announcement bar
- Mobile-first responsive design
- Full accessibility (WCAG AA): focus management, ARIA, skip-to-content, 44px touch targets
- SEO: dynamic metadata, Open Graph, canonical URLs, sitemap, robots.txt, JSON-LD structured data
- Security headers: CSP, HSTS, X-Frame-Options, Permissions-Policy via middleware
- i18n with English + Spanish

## Deployment

### Medusa Cloud

If you're already hosting your backend on Medusa Cloud:

1. Push this repo to GitHub
2. In Cloud → your project → connect the storefront to this repo
3. Set the env vars on the storefront environment (Build: ON, Runtime: ON)
4. Cloud builds and serves it on `<your-subdomain>.medusajs.site`

### Vercel

If you're hosting your backend elsewhere and want Vercel for the storefront:

1. Push this repo to GitHub
2. Vercel → New Project → import this repo
3. Set the env vars in Project Settings → Environment Variables
4. Deploy. Vercel hosts at `<your-project>.vercel.app` or your custom domain.

The backend can live anywhere — Medusa Cloud, Railway, Render, AWS, your own server. Lumen only needs the HTTP URL.

## Project structure

```
src/
  app/
    (store)/                    # Storefront routes
      [countryCode]/            # Region-scoped routes (Medusa convention)
      cart/
      checkout/
      account/
      auth/
    sitemap.ts
  components/                   # UI components (shadcn + custom)
  lib/
    medusa.ts                   # @medusajs/js-sdk client
    repositories/               # Data access layer (swappable)
    checkout/                   # Pluggable checkout provider
    validators/                 # Zod schemas
    config.ts                   # Store name, contact, social, currency
    navigation.ts               # Menu config
  store/                        # Zustand stores (wishlist, recently-viewed)
  types/                        # Backend-agnostic data contract
  i18n/                         # next-intl config
messages/
  en.json, es.json              # Translations
```

## Adding connectors

Lumen ships with a clean repository layer. To plug in a third-party service (reviews, alternate payment provider, IMS sync, etc.), implement against the repository interface and swap the binding in `src/lib/repositories/index.ts`. The components don't change.

We maintain a growing set of Medusa connectors at [Epic Design Labs](https://epicdesignlabs.com) — including payment orchestration, IMS sync, reviews, and ticketing.

## Contributing

Issues and PRs welcome at [github.com/Epic-Design-Labs/medusa-nextjs-lumen](https://github.com/Epic-Design-Labs/medusa-nextjs-lumen/issues).

## License

MIT — free for personal and commercial use.

## Acknowledgments

Lumen builds on [Epic Design Labs' Next.js Ecommerce Starter](https://github.com/Epic-Design-Labs/nextjs-ecommerce-starter), specialized for Medusa.
