import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/config"
import {
  productRepository,
  categoryRepository,
  brandRepository,
} from "@/lib/repositories"
import { sdk } from "@/lib/medusa"

// Static public routes. Admin (the Medusa backend), account, auth, and
// checkout are intentionally excluded — they're handled by robots.txt's
// disallow rules and aren't useful for indexing.
const STATIC_PATHS = [
  { path: "", priority: 1, changeFrequency: "daily" as const },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/brands", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/pages", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/policies/shipping", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/policies/returns", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/policies/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/policies/terms", priority: 0.3, changeFrequency: "yearly" as const },
]

async function getCountryCodes(): Promise<string[]> {
  try {
    const { regions } = await sdk.store.region.list({})
    const codes = new Set<string>()
    for (const r of regions) {
      for (const c of r.countries ?? []) {
        if (c.iso_2) codes.add(c.iso_2.toLowerCase())
      }
    }
    return codes.size > 0 ? [...codes].sort() : ["us"]
  } catch {
    return ["us"]
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productsResult, categories, brands, countryCodes] = await Promise.all([
    productRepository.list(undefined, undefined, { page: 1, limit: 10_000 }),
    categoryRepository.list(),
    brandRepository.list(),
    getCountryCodes(),
  ])

  const now = new Date()
  const base = siteConfig.url.replace(/\/$/, "")

  const entries: MetadataRoute.Sitemap = []

  for (const country of countryCodes) {
    // Static routes per country
    for (const p of STATIC_PATHS) {
      entries.push({
        url: `${base}/${country}${p.path}`,
        lastModified: now,
        changeFrequency: p.changeFrequency,
        priority: p.priority,
      })
    }

    // Products
    for (const p of productsResult.items) {
      entries.push({
        url: `${base}/${country}/${p.slug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
        changeFrequency: "weekly",
        priority: 0.8,
      })
    }

    // Categories
    for (const c of categories) {
      entries.push({
        url: `${base}/${country}/${c.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: c.parentId ? 0.6 : 0.8,
      })
    }

    // Brands (derived from product types)
    for (const b of brands) {
      entries.push({
        url: `${base}/${country}/${b.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      })
    }
  }

  return entries
}
