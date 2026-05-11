"use client"

import type { Product } from "@/types"
import { sdk, DEFAULT_REGION } from "./medusa"

let regionIdPromise: Promise<string | null> | null = null

async function resolveRegionId(): Promise<string | null> {
  if (!regionIdPromise) {
    regionIdPromise = sdk.store.region
      .list({})
      .then(({ regions }) => {
        const match = regions.find((r) =>
          r.countries?.some((c) => c.iso_2 === DEFAULT_REGION)
        )
        return (match ?? regions[0])?.id ?? null
      })
      .catch(() => null)
  }
  return regionIdPromise
}

/**
 * Client-side product search for the Cmd+K modal and other client surfaces.
 * Returns a minimal shape that matches what `Product` consumers (ProductCard,
 * SearchModal results) need to render — `images`, `variants[0].price`, etc.
 */
export async function searchProductsClient(
  query: string,
  limit = 6
): Promise<Product[]> {
  const regionId = await resolveRegionId()
  if (!regionId) return []

  try {
    const { products } = await sdk.store.product.list({
      q: query,
      region_id: regionId,
      fields: "id,handle,title,subtitle,thumbnail,*variants,*variants.calculated_price",
      limit,
    })

    return products.map((p) => {
      const v = p.variants?.[0]
      const calculated =
        (v as { calculated_price?: { calculated_amount?: number } } | undefined)?.calculated_price
      return {
        id: p.id,
        name: p.title ?? "",
        slug: p.handle ?? p.id,
        description: p.subtitle ?? "",
        body: undefined,
        images: p.thumbnail ? [{ url: p.thumbnail, alt: p.title ?? "" }] : [],
        status: "active",
        brandId: "",
        categoryIds: [],
        tags: [],
        variants: v
          ? [
              {
                id: v.id,
                productId: p.id,
                sku: v.sku ?? "",
                name: v.title ?? "",
                price: calculated?.calculated_amount ?? 0,
                currency: "usd",
                inventory: {
                  quantity: 0,
                  trackInventory: false,
                  allowBackorder: false,
                },
                options: [],
                images: [],
              },
            ]
          : [],
        rating: 0,
        reviewCount: 0,
        featured: false,
        createdAt: p.created_at ?? "",
        updatedAt: p.updated_at ?? "",
      }
    })
  } catch {
    return []
  }
}

/**
 * Hydrate a set of products by ID (used by wishlist + recently viewed).
 * Returns only the products that still exist.
 */
export async function fetchProductsByIdClient(
  ids: string[]
): Promise<Product[]> {
  if (ids.length === 0) return []
  const regionId = await resolveRegionId()
  if (!regionId) return []

  try {
    const { products } = await sdk.store.product.list({
      id: ids,
      region_id: regionId,
      fields: "id,handle,title,subtitle,thumbnail,*variants,*variants.calculated_price",
      limit: ids.length,
    })

    return products.map((p) => {
      const v = p.variants?.[0]
      const calculated =
        (v as { calculated_price?: { calculated_amount?: number } } | undefined)?.calculated_price
      return {
        id: p.id,
        name: p.title ?? "",
        slug: p.handle ?? p.id,
        description: p.subtitle ?? "",
        body: undefined,
        images: p.thumbnail ? [{ url: p.thumbnail, alt: p.title ?? "" }] : [],
        status: "active",
        brandId: "",
        categoryIds: [],
        tags: [],
        variants: v
          ? [
              {
                id: v.id,
                productId: p.id,
                sku: v.sku ?? "",
                name: v.title ?? "",
                price: calculated?.calculated_amount ?? 0,
                currency: "usd",
                inventory: {
                  quantity: 0,
                  trackInventory: false,
                  allowBackorder: false,
                },
                options: [],
                images: [],
              },
            ]
          : [],
        rating: 0,
        reviewCount: 0,
        featured: false,
        createdAt: p.created_at ?? "",
        updatedAt: p.updated_at ?? "",
      }
    })
  } catch {
    return []
  }
}
