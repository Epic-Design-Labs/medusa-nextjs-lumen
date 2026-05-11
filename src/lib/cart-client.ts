"use client"

import type { HttpTypes } from "@medusajs/types"
import { sdk, DEFAULT_REGION } from "./medusa"
import type { Cart, CartItem } from "@/types"

const CART_COOKIE = "lumen_cart_id"
const CART_FIELDS =
  "*items,*items.variant,*items.variant.product,*items.variant.product.images,*items.thumbnail,*region"

type StoreCart = HttpTypes.StoreCart

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : null
}

function writeCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return
  const maxAge = days * 24 * 60 * 60
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return
  document.cookie = `${name}=;path=/;max-age=0;SameSite=Lax`
}

let regionsPromise: Promise<HttpTypes.StoreRegion[]> | null = null

async function fetchRegions(): Promise<HttpTypes.StoreRegion[]> {
  if (!regionsPromise) {
    regionsPromise = sdk.store.region.list({}).then((r) => r.regions)
  }
  return regionsPromise
}

async function regionIdFor(countryCode: string): Promise<string | null> {
  const regions = await fetchRegions()
  const exact = regions.find((r) =>
    r.countries?.some((c) => c.iso_2 === countryCode.toLowerCase())
  )
  return (exact ?? regions[0])?.id ?? null
}

function transform(c: StoreCart): Cart {
  const currency = (c.currency_code ?? "usd").toLowerCase()
  const items: CartItem[] = (c.items ?? []).map((li) => {
    const variant = (li as { variant?: HttpTypes.StoreProductVariant }).variant
    const product = variant?.product
    const firstImage = product?.images?.[0]?.url ?? product?.thumbnail ?? li.thumbnail ?? ""
    const quantity = li.quantity ?? 0
    const unit = li.unit_price ?? 0
    return {
      id: li.id,
      lineItemId: li.id,
      variantId: variant?.id ?? li.variant_id ?? "",
      productId: product?.id ?? li.product_id ?? "",
      name: product?.title ?? li.product_title ?? li.title ?? "",
      variantName: variant?.title ?? li.variant_title ?? "Default",
      image: { url: firstImage, alt: product?.title ?? li.product_title ?? "" },
      slug: product?.handle ?? li.product_handle ?? "",
      price: unit,
      quantity,
      lineTotal: li.subtotal ?? unit * quantity,
      currency,
    }
  })

  return {
    id: c.id,
    items,
    subtotal: c.subtotal ?? 0,
    tax: c.tax_total ?? 0,
    shipping: c.shipping_total ?? 0,
    total: c.total ?? 0,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    currency,
  }
}

async function fetchExistingCart(cartId: string): Promise<StoreCart | null> {
  try {
    const { cart } = await sdk.store.cart.retrieve(cartId, {
      fields: CART_FIELDS,
    })
    return cart ?? null
  } catch {
    return null
  }
}

export async function getCart(): Promise<Cart | null> {
  const id = readCookie(CART_COOKIE)
  if (!id) return null
  const c = await fetchExistingCart(id)
  if (!c) {
    clearCookie(CART_COOKIE)
    return null
  }
  return transform(c)
}

export async function ensureCart(countryCode?: string): Promise<Cart> {
  const code = (countryCode ?? DEFAULT_REGION).toLowerCase()
  const existingId = readCookie(CART_COOKIE)
  if (existingId) {
    const existing = await fetchExistingCart(existingId)
    if (existing) return transform(existing)
    clearCookie(CART_COOKIE)
  }
  const regionId = await regionIdFor(code)
  if (!regionId) {
    throw new Error(
      "No Medusa region available. Configure at least one region in your backend."
    )
  }
  const { cart } = await sdk.store.cart.create({ region_id: regionId })
  writeCookie(CART_COOKIE, cart.id)
  // Re-fetch with fields so we get the standard shape
  const fresh = await fetchExistingCart(cart.id)
  return transform(fresh ?? cart)
}

export async function addLineItem(
  variantId: string,
  quantity = 1,
  countryCode?: string
): Promise<Cart> {
  const cart = await ensureCart(countryCode)
  const { cart: updated } = await sdk.store.cart.createLineItem(cart.id, {
    variant_id: variantId,
    quantity,
  })
  const fresh = await fetchExistingCart(updated.id)
  return transform(fresh ?? updated)
}

export async function updateLineItem(
  lineItemId: string,
  quantity: number
): Promise<Cart> {
  const id = readCookie(CART_COOKIE)
  if (!id) throw new Error("No cart")
  if (quantity <= 0) return removeLineItem(lineItemId)
  const { cart } = await sdk.store.cart.updateLineItem(id, lineItemId, {
    quantity,
  })
  const fresh = await fetchExistingCart(cart.id)
  return transform(fresh ?? cart)
}

export async function removeLineItem(lineItemId: string): Promise<Cart> {
  const id = readCookie(CART_COOKIE)
  if (!id) throw new Error("No cart")
  const { parent } = (await sdk.store.cart.deleteLineItem(id, lineItemId)) as {
    parent: StoreCart
  }
  const fresh = await fetchExistingCart(id)
  return transform(fresh ?? parent)
}

export function clearLocalCart() {
  clearCookie(CART_COOKIE)
}

export const CART_COOKIE_NAME = CART_COOKIE
