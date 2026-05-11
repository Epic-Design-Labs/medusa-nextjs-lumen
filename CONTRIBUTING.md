# Contributing to Lumen

Thanks for your interest in contributing! Lumen is open source under the MIT
license. We welcome bug reports, fixes, features, and docs improvements.

## Quick setup

```bash
git clone https://github.com/Epic-Design-Labs/medusa-nextjs-lumen.git
cd medusa-nextjs-lumen
cp .env.example .env.local
# Edit .env.local — point at a Medusa v2 backend
npm install
npm run dev
```

You'll need:

- **Node.js 20+**
- A running **Medusa v2 backend** (Cloud, local Docker, Railway, etc.)
- A **publishable API key** from that backend, scoped to a sales channel
  attached to your products

## Before you open a PR

```bash
npm run lint
npx tsc --noEmit
npm run build
```

All three should pass locally — the CI runs the same checks on every PR.

## How to propose changes

1. Open an issue first for anything non-trivial — easier to align before code
2. Fork the repo, create a branch off `main`, push to your fork
3. Open a PR against `Epic-Design-Labs/medusa-nextjs-lumen:main`
4. Describe the change, the reasoning, and how to test

For bug fixes, include a minimal repro (steps + expected vs actual).

## Project conventions

- **Repositories** are the swap-point for data sources. If you need to fetch
  Medusa data from a page, go through `src/lib/repositories/` rather than
  calling the SDK directly. This keeps pages backend-agnostic.
- **Region-aware links**: use the `useCountryLink()` hook in client components
  so paths get prefixed with the current country code. Server components can
  read `params.countryCode` directly.
- **Payment providers**: new providers go in
  `src/components/checkout/payment-provider-input.tsx`. Add a dispatch branch
  in the `PaymentProviderInput` function and a renderer below.
- **Types** in `src/types/index.ts` are intentionally backend-agnostic. The
  repository implementations are responsible for transforming Medusa shapes
  into these.
- **No emojis** in code or commit messages. README copy can use them sparingly.

## Commit messages

Conventional, descriptive, present tense:

- ✅ `Add Klarna payment provider`
- ✅ `Fix cart totals not refreshing after promo code removal`
- ❌ `updates`
- ❌ `fixed bug`

## Code style

- TypeScript strict mode is on; don't disable per-file
- Prefer Server Components by default; reach for `"use client"` only when
  you need state/effects/event handlers
- Tailwind utility classes — use shadcn primitives in `src/components/ui/`
  when one exists rather than rolling new variants

## Reporting security issues

Please don't open public issues for security vulnerabilities. Email
**support@epicdesignlabs.com** with the details and we'll work on a fix.

## License

By contributing, you agree your contributions are licensed under the MIT
license (same as the project).
