import type { HttpTypes } from "@medusajs/types"
import { sdk } from "@/lib/medusa"

type StoreCollection = HttpTypes.StoreCollection

export interface Collection {
  id: string
  handle: string
  title: string
  metadata?: Record<string, unknown>
}

function transform(c: StoreCollection): Collection {
  return {
    id: c.id,
    handle: c.handle ?? c.id,
    title: c.title ?? "",
    metadata: c.metadata as Record<string, unknown> | undefined,
  }
}

let cache: Promise<Collection[]> | null = null

async function fetchAll(): Promise<Collection[]> {
  if (!cache) {
    cache = sdk.store.collection
      .list({ limit: 200, fields: "id,handle,title,metadata" })
      .then(({ collections }) => collections.map(transform))
  }
  return cache
}

export const medusaCollectionRepository = {
  async list(): Promise<Collection[]> {
    return fetchAll()
  },
  async getByHandle(handle: string): Promise<Collection | null> {
    const all = await fetchAll()
    return all.find((c) => c.handle === handle) ?? null
  },
}
