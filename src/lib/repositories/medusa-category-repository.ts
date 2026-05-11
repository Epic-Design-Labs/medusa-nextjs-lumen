import type { HttpTypes } from "@medusajs/types"
import type { Category, CategoryRepository } from "@/types"
import { sdk } from "@/lib/medusa"

type StoreCategory = HttpTypes.StoreProductCategory

function transformCategory(c: StoreCategory, order = 0): Category {
  const metadata = (c.metadata ?? {}) as Record<string, unknown>
  return {
    id: c.id,
    name: c.name ?? "",
    slug: c.handle ?? c.id,
    description: c.description ?? "",
    image:
      typeof metadata.imageUrl === "string"
        ? { url: metadata.imageUrl, alt: c.name ?? "" }
        : undefined,
    parentId: c.parent_category_id ?? undefined,
    order:
      typeof metadata.order === "number"
        ? metadata.order
        : c.rank ?? order,
  }
}

let listCache: Promise<Category[]> | null = null

async function fetchAll(): Promise<Category[]> {
  if (!listCache) {
    listCache = sdk.store.category
      .list({
        limit: 200,
        fields: "id,name,handle,description,parent_category_id,rank,metadata",
      })
      .then(({ product_categories }) =>
        product_categories
          .map((c, idx) => transformCategory(c, idx))
          .sort((a, b) => a.order - b.order)
      )
  }
  return listCache
}

export const medusaCategoryRepository: CategoryRepository & {
  getChildren(parentId: string): Promise<Category[]>
  getTopLevel(): Promise<Category[]>
  getAncestors(categoryId: string): Promise<Category[]>
} = {
  async list() {
    return fetchAll()
  },

  async getBySlug(slug) {
    const all = await fetchAll()
    return all.find((c) => c.slug === slug) ?? null
  },

  async getById(id) {
    const all = await fetchAll()
    return all.find((c) => c.id === id) ?? null
  },

  async getChildren(parentId) {
    const all = await fetchAll()
    return all
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.order - b.order)
  },

  async getTopLevel() {
    const all = await fetchAll()
    return all.filter((c) => !c.parentId).sort((a, b) => a.order - b.order)
  },

  async getAncestors(categoryId) {
    const all = await fetchAll()
    const chain: Category[] = []
    let current = all.find((c) => c.id === categoryId)
    while (current) {
      chain.unshift(current)
      current = current.parentId
        ? all.find((c) => c.id === current!.parentId)
        : undefined
    }
    return chain
  },
}
