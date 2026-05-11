import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ShieldCheck, Globe2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { siteConfig } from "@/lib/config"
import { ProductGrid } from "@/components/products/product-grid"
import { NewsletterForm } from "@/components/layout/newsletter-form"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { productRepository, categoryRepository } from "@/lib/repositories"

const LUMEN_TAGLINE =
  "Lumen — a modern Next.js storefront starter for Medusa. Designed by Epic Design Labs to deploy natively on Medusa Cloud or Vercel."

const REPO_URL = "https://github.com/Epic-Design-Labs/medusa-nextjs-lumen"

export const metadata: Metadata = {
  title: "Lumen — Next.js Storefront Starter for Medusa | Epic Design Labs",
  description: LUMEN_TAGLINE,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Lumen — Next.js Storefront Starter for Medusa",
    description: LUMEN_TAGLINE,
    type: "website",
    url: siteConfig.url,
  },
  keywords: [
    "medusa storefront",
    "medusa nextjs starter",
    "medusa nextjs template",
    "medusajs starter",
    "medusajs storefront",
    "headless commerce starter",
    "tailwind medusa template",
    "shadcn medusa storefront",
    "open source medusa storefront",
  ],
}

interface HomePageProps {
  params: Promise<{ countryCode: string }>
}

export default async function HomePage({ params }: HomePageProps) {
  const { countryCode } = await params
  const categories = await categoryRepository.list()
  const featuredProducts = await productRepository.getFeatured(4)
  const topCategories = categories.filter((c) => !c.parentId).slice(0, 6)

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex h-[650px] items-center justify-center bg-neutral-50">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            Open source · MIT · Medusa Cloud or Vercel
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Lumen Starter for Medusa JS
          </h1>
          <p className="mt-4 text-lg font-medium text-foreground/80 sm:text-xl">
            A modern Next.js storefront starter for Medusa.
          </p>
          <p className="mt-6 text-base text-muted-foreground sm:text-lg">
            Production-ready commerce on day one. Native Medusa features
            wired end-to-end — catalog, multi-region pricing, cart,
            promotions, checkout, customer accounts, returns — with a
            payment layer that already speaks Stripe and PayPal and
            plugs into any other Medusa provider.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href={`/${countryCode}/shop`}>
                Browse the demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={REPO_URL} target="_blank" rel="noopener">
                View on GitHub
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pitch panels */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border bg-white p-6">
            <Globe2 className="h-6 w-6 text-foreground" />
            <h3 className="mt-4 text-base font-semibold">Cloud or Vercel</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Same code deploys to Medusa Cloud or Vercel. No platform-specific
              dependencies in critical paths — just an env-driven backend URL.
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <ShieldCheck className="h-6 w-6 text-foreground" />
            <h3 className="mt-4 text-base font-semibold">Gateway-agnostic</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              A clean payment-provider abstraction. Stripe Elements and PayPal
              Smart Buttons ship in the box. Adding a new provider is one file.
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <Sparkles className="h-6 w-6 text-foreground" />
            <h3 className="mt-4 text-base font-semibold">Designed, not generated</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Built on Next.js 16, Tailwind v4, and shadcn/ui by{" "}
              <Link
                href="https://epicdesignlabs.com"
                className="underline hover:text-foreground"
                target="_blank"
                rel="noopener"
              >
                Epic Design Labs
              </Link>
              . Accessible, responsive, SEO-ready out of the box.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      {topCategories.length > 0 && (
        <section className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              Shop by category
            </h2>
            <Link
              href={`/${countryCode}/shop`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {topCategories.map((category) => (
              <Link
                key={category.id}
                href={`/${countryCode}/${category.slug}`}
                className="group"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
                  <Image
                    src={category.image?.url ?? PLACEHOLDER_IMAGE}
                    alt={category.image?.alt ?? category.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 16vw"
                  />
                </div>
                <div className="mt-3 text-center">
                  <h3 className="text-sm font-medium group-hover:underline">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              Featured products
            </h2>
            <Link
              href={`/${countryCode}/shop`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <div className="mt-8">
            <ProductGrid products={featuredProducts} />
          </div>
        </section>
      )}

      {/* Developer CTA */}
      <section className="border-t bg-neutral-50">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Use Lumen for your Medusa store
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Clone it, point it at your Medusa backend, deploy to Medusa Cloud
            or Vercel. MIT-licensed. Or hire{" "}
            <Link
              href="https://epicdesignlabs.com"
              target="_blank"
              rel="noopener"
              className="underline hover:text-foreground"
            >
              Epic Design Labs
            </Link>{" "}
            to build the storefront for you.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href={REPO_URL} target="_blank" rel="noopener">
                Get Lumen on GitHub
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link
                href="https://epicdesignlabs.com"
                target="_blank"
                rel="noopener"
              >
                Hire Epic Design Labs
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-neutral-900 text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Stay in the loop
          </h2>
          <p className="mt-4 text-neutral-400">
            Connector releases, new features, and Medusa ecosystem updates.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  )
}
