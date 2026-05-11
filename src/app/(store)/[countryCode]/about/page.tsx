import type { Metadata } from "next"
import Link from "next/link"

const REPO_URL = "https://github.com/Epic-Design-Labs/medusa-nextjs-lumen"

export const metadata: Metadata = {
  title: "About Lumen",
  description:
    "Lumen is an open-source Next.js storefront starter for Medusa, designed by Epic Design Labs. Deploys to Medusa Cloud or Vercel.",
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">About Lumen</h1>
      <div className="mt-8 space-y-6 text-muted-foreground">
        <p>
          Lumen is an open-source Next.js storefront starter for{" "}
          <a
            href="https://medusajs.com"
            target="_blank"
            rel="noopener"
            className="underline hover:text-foreground"
          >
            Medusa
          </a>
          . It&apos;s designed to be the fastest way to launch a production-grade
          storefront on top of a Medusa v2 backend — every native Medusa
          feature is wired end-to-end, the design is yours to brand, and the
          payment layer plugs into whichever provider your store uses.
        </p>
        <p>
          This site is a live demo: catalog, cart, checkout, customer accounts,
          orders, addresses, returns — all real flows against a real Medusa
          Cloud backend. Browse around, place a test order, see how it feels.
        </p>

        <h2 className="!mt-12 text-xl font-semibold text-foreground">
          Why Lumen
        </h2>
        <p>
          Most Medusa storefront starters today are tied to a single deploy
          target and a single payment provider. Lumen makes both portable.
        </p>
        <ul className="list-inside list-disc space-y-2">
          <li>
            <strong className="text-foreground">Deploys natively to Medusa Cloud or Vercel.</strong>{" "}
            Same code, same env vars — no platform-specific dependencies in
            critical paths.
          </li>
          <li>
            <strong className="text-foreground">Gateway-agnostic payments.</strong>{" "}
            Stripe Elements and PayPal Smart Buttons ship in the box. Adding a
            new payment provider is a single file.
          </li>
          <li>
            <strong className="text-foreground">All native Medusa features.</strong>{" "}
            Products, variants, categories, collections, multi-region pricing,
            promotion codes, gift cards, customer auth, address book, order
            history, and customer-initiated returns.
          </li>
          <li>
            <strong className="text-foreground">Designed, not generated.</strong>{" "}
            Built on Next.js 16, Tailwind v4, and shadcn/ui by a design agency
            that ships ecommerce for a living.
          </li>
          <li>
            <strong className="text-foreground">Production-grade defaults.</strong>{" "}
            Region routing, SEO metadata, structured data, sitemap, accessibility,
            security headers, i18n — wired in.
          </li>
        </ul>

        <h2 className="!mt-12 text-xl font-semibold text-foreground">
          What&apos;s in the box
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Catalog: products, variants, options, categories, collections, brands, search</li>
          <li>Multi-region routing under <code className="rounded bg-muted px-1">/[countryCode]/...</code> with region-driven pricing</li>
          <li>Cart: line items, promotion codes, gift cards, server-computed totals</li>
          <li>Checkout: address → shipping option → payment session → order complete</li>
          <li>Payment providers: Stripe Elements, PayPal Smart Buttons, manual system_default, generic fallback</li>
          <li>Customer auth: register / login / logout / forgot password / reset password</li>
          <li>Account: orders, order detail, addresses (CRUD + default), profile, returns</li>
          <li>Pluggable repository layer (swap data sources without touching pages)</li>
          <li>shadcn/ui components, Tailwind v4, Next.js 16 App Router</li>
          <li>SEO + structured data, sitemap, robots.txt, security headers, i18n (EN/ES)</li>
        </ul>

        <h2 className="!mt-12 text-xl font-semibold text-foreground">
          Get Lumen
        </h2>
        <p>
          Lumen is MIT-licensed. Clone the repo, point it at your Medusa
          backend, deploy.
        </p>
        <p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener"
            className="underline hover:text-foreground"
          >
            github.com/Epic-Design-Labs/medusa-nextjs-lumen
          </a>
        </p>

        <h2 className="!mt-12 text-xl font-semibold text-foreground">
          Built by Epic Design Labs
        </h2>
        <p>
          Lumen is designed and maintained by{" "}
          <a
            href="https://epicdesignlabs.com"
            target="_blank"
            rel="noopener"
            className="underline hover:text-foreground"
          >
            Epic Design Labs
          </a>
          , a design and development studio that builds high-performing
          ecommerce experiences. If you need help launching on Medusa,
          customizing Lumen, or building a private fork with deeper integrations,{" "}
          <Link href="/contact" className="underline hover:text-foreground">
            get in touch
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
