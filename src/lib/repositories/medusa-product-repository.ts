import type { HttpTypes } from "@medusajs/types"
import type {
  PaginatedResult,
  PaginationParams,
  Product,
  ProductFilters,
  ProductImage,
  ProductRepository,
  ProductVariant,
  SortOption,
} from "@/types"
import { sdk } from "@/lib/medusa"
import { resolveRegion } from "@/lib/medusa-region"

type StoreProduct = HttpTypes.StoreProduct
type StoreProductVariant = HttpTypes.StoreProductVariant

function transformImage(
  image: { url?: string | null; id?: string } | undefined,
  fallbackAlt: string
): ProductImage {
  return {
    url: image?.url ?? "",
    alt: fallbackAlt,
  }
}

function transformVariant(
  variant: StoreProductVariant,
  productId: string,
  productName: string,
  productImage: ProductImage | undefined,
  currency: string
): ProductVariant {
  const calculated = (variant as { calculated_price?: { calculated_amount?: number; original_amount?: number } })
    .calculated_price
  const price = calculated?.calculated_amount ?? 0
  const original = calculated?.original_amount

  return {
    id: variant.id,
    productId,
    sku: variant.sku ?? "",
    name: variant.title ?? productName,
    price,
    compareAtPrice: original && original > price ? original : undefined,
    currency,
    inventory: {
      quantity: variant.inventory_quantity ?? 0,
      trackInventory: variant.manage_inventory ?? false,
      allowBackorder: variant.allow_backorder ?? false,
    },
    options: (variant.options ?? []).map((o) => ({
      name: o.option?.title ?? "",
      value: o.value ?? "",
    })),
    images: productImage ? [productImage] : [],
    weight: variant.weight ?? undefined,
    dimensions:
      variant.length && variant.width && variant.height
        ? {
            length: variant.length,
            width: variant.width,
            height: variant.height,
          }
        : undefined,
  }
}

function transformProduct(p: StoreProduct, currency: string): Product {
  const images: ProductImage[] = (p.images ?? []).map((img) =>
    transformImage(img, p.title ?? "")
  )
  if (p.thumbnail && !images.some((i) => i.url === p.thumbnail)) {
    images.unshift({ url: p.thumbnail, alt: p.title ?? "" })
  }

  const primaryImage = images[0]
  const variants = (p.variants ?? []).map((v) =>
    transformVariant(v, p.id, p.title ?? "", primaryImage, currency)
  )

  const metadata = (p.metadata ?? {}) as Record<string, unknown>

  return {
    id: p.id,
    name: p.title ?? "",
    slug: p.handle ?? p.id,
    description: p.subtitle ?? "",
    body: p.description ?? undefined,
    images,
    status: p.status === "published" ? "active" : "draft",
    brandId: typeof metadata.brandId === "string" ? metadata.brandId : (p.type?.id ?? ""),
    categoryIds: (p.categories ?? []).map((c) => c.id),
    tags: (p.tags ?? []).map((t) => t.value),
    variants,
    rating:
      typeof metadata.rating === "number" ? metadata.rating : 0,
    reviewCount:
      typeof metadata.reviewCount === "number" ? metadata.reviewCount : 0,
    featured: metadata.featured === true,
    createdAt: p.created_at ?? new Date().toISOString(),
    updatedAt: p.updated_at ?? new Date().toISOString(),
  }
}

function buildOrderParam(sort?: SortOption): string | undefined {
  if (!sort) return undefined
  const fieldMap: Record<string, string> = {
    createdAt: "created_at",
    name: "title",
  }
  const field = fieldMap[sort.field] ?? sort.field
  if (field === "price") return undefined // not supported server-side
  return sort.order === "desc" ? `-${field}` : field
}

function applyClientFilters(items: Product[], filters?: ProductFilters): Product[] {
  if (!filters) return items
  return items.filter((p) => {
    if (filters.priceRange) {
      const price = p.variants[0]?.price ?? 0
      if (filters.priceRange.min !== undefined && price < filters.priceRange.min)
        return false
      if (filters.priceRange.max !== undefined && price > filters.priceRange.max)
        return false
    }
    if (filters.inStock) {
      const anyInStock = p.variants.some(
        (v) => v.inventory.quantity > 0 || v.inventory.allowBackorder
      )
      if (!anyInStock) return false
    }
    if (filters.tags && filters.tags.length > 0) {
      if (!filters.tags.some((t) => p.tags.includes(t))) return false
    }
    return true
  })
}

function applyClientSort(items: Product[], sort?: SortOption): Product[] {
  if (!sort || sort.field !== "price") return items
  return [...items].sort((a, b) => {
    const priceA = a.variants[0]?.price ?? 0
    const priceB = b.variants[0]?.price ?? 0
    return sort.order === "desc" ? priceB - priceA : priceA - priceB
  })
}

async function resolveCategoryIdBySlug(slug: string): Promise<string | null> {
  const { product_categories } = await sdk.store.category.list({
    handle: slug,
    limit: 1,
  })
  return product_categories[0]?.id ?? null
}

export const medusaProductRepository: ProductRepository = {
  async list(filters, sort, pagination) {
    const region = await resolveRegion()
    const page = pagination?.page ?? 1
    const limit = pagination?.limit ?? 12

    const params: HttpTypes.StoreProductListParams = {
      region_id: region.id,
      fields: "*variants,*variants.calculated_price,*categories,*tags,*type,+thumbnail,+metadata",
      limit,
      offset: (page - 1) * limit,
    }

    if (filters?.search) params.q = filters.search
    if (filters?.category) {
      const categoryId = await resolveCategoryIdBySlug(filters.category)
      if (categoryId) params.category_id = [categoryId]
      else
        return {
          items: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        }
    }

    const order = buildOrderParam(sort)
    if (order) params.order = order

    const { products, count } = await sdk.store.product.list(params)
    let items = products.map((p) => transformProduct(p, region.currency))
    items = applyClientFilters(items, filters)
    items = applyClientSort(items, sort)

    const totalPages = Math.max(1, Math.ceil(count / limit))
    return {
      items,
      pagination: {
        total: count,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  },

  async getBySlug(slug) {
    const region = await resolveRegion()
    try {
      const { products } = await sdk.store.product.list({
        handle: slug,
        region_id: region.id,
        fields: "*variants,*variants.calculated_price,*categories,*tags,*type,+thumbnail,+metadata",
        limit: 1,
      })
      return products[0]
        ? transformProduct(products[0], region.currency)
        : null
    } catch {
      return null
    }
  },

  async getById(id) {
    const region = await resolveRegion()
    try {
      const { product } = await sdk.store.product.retrieve(id, {
        region_id: region.id,
        fields: "*variants,*variants.calculated_price,*categories,*tags,*type,+thumbnail,+metadata",
      })
      return product ? transformProduct(product, region.currency) : null
    } catch {
      return null
    }
  },

  async getFeatured(limit = 4) {
    // No native "featured" — use products with metadata.featured === true.
    // Falls back to first N products if none are explicitly featured.
    const region = await resolveRegion()
    const { products } = await sdk.store.product.list({
      region_id: region.id,
      fields: "*variants,*variants.calculated_price,*categories,*tags,*type,+thumbnail,+metadata",
      limit: 50,
    })
    const transformed = products.map((p) => transformProduct(p, region.currency))
    const featured = transformed.filter((p) => p.featured)
    return (featured.length > 0 ? featured : transformed).slice(0, limit)
  },

  async getByCategory(categorySlug, pagination) {
    return this.list({ category: categorySlug }, undefined, pagination)
  },

  async search(query, pagination) {
    return this.list({ search: query }, undefined, pagination)
  },
}
