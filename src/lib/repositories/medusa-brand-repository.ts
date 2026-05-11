import type { Brand } from "@/types"
import { sdk } from "@/lib/medusa"

/**
 * Medusa v2 has no native "brand" concept. This repository derives brands
 * from product `type.value`. A custom Medusa module can add first-class
 * brands later; the repository interface stays the same.
 *
 * Convention: a product's `type` is treated as its brand.
 *   - type.id     → brand.id
 *   - type.value  → brand.name
 *   - slugified   → brand.slug
 */

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

let cache: Promise<Brand[]> | null = null

async function fetchAll(): Promise<Brand[]> {
  if (!cache) {
    cache = sdk.store.product
      .list({ fields: "id,type", limit: 200 })
      .then(({ products }) => {
        const seen = new Map<string, Brand>()
        for (const p of products) {
          if (!p.type || !p.type.value) continue
          if (seen.has(p.type.id)) continue
          seen.set(p.type.id, {
            id: p.type.id,
            name: p.type.value,
            slug: slugify(p.type.value),
            description: "",
          })
        }
        return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
      })
  }
  return cache
}

export const medusaBrandRepository = {
  async list(): Promise<Brand[]> {
    return fetchAll()
  },

  async getBySlug(slug: string): Promise<Brand | null> {
    const all = await fetchAll()
    return all.find((b) => b.slug === slug) ?? null
  },

  async getById(id: string): Promise<Brand | null> {
    const all = await fetchAll()
    return all.find((b) => b.id === id) ?? null
  },
}
