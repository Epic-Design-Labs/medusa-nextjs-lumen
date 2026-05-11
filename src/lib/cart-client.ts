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

// =============================================================================
// Promotion codes
// =============================================================================

/**
 * Apply one or more promotion codes to the current cart. Medusa returns the
 * updated cart with discounts reflected in subtotal/total. If a code is
 * invalid, Medusa silently drops it — caller should inspect the returned
 * cart's promotions to verify.
 */
export async function applyPromotionCodes(codes: string[]): Promise<Cart> {
  const id = requireCartId()
  const { cart } = await sdk.store.cart.update(id, {
    promo_codes: codes,
  } as Partial<HttpTypes.StoreUpdateCart>)
  const fresh = await fetchExistingCart(cart.id)
  return transform(fresh ?? cart)
}

/**
 * Read the codes currently applied to the cart. Used to render badges and
 * power the "remove code" button.
 */
export async function getAppliedPromotionCodes(): Promise<string[]> {
  const id = readCookie(CART_COOKIE)
  if (!id) return []
  const cart = await fetchExistingCart(id)
  const promotions =
    (cart as { promotions?: Array<{ code?: string }> } | null)?.promotions ?? []
  return promotions.map((p) => p.code ?? "").filter(Boolean)
}

// =============================================================================
// Checkout (Phase 4)
// =============================================================================

export interface CheckoutAddress {
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  city: string
  province?: string
  postal_code: string
  country_code: string
  phone?: string
  company?: string
}

function requireCartId(): string {
  const id = readCookie(CART_COOKIE)
  if (!id) throw new Error("No cart")
  return id
}

/**
 * Set contact email + shipping (and optionally billing) address on the cart.
 * If `billing_address` is omitted, billing mirrors shipping.
 */
export async function updateCartContact(args: {
  email: string
  shipping_address: CheckoutAddress
  billing_address?: CheckoutAddress
}): Promise<Cart> {
  const id = requireCartId()
  const { cart } = await sdk.store.cart.update(id, {
    email: args.email,
    shipping_address: args.shipping_address,
    billing_address: args.billing_address ?? args.shipping_address,
  })
  const fresh = await fetchExistingCart(cart.id)
  return transform(fresh ?? cart)
}

export interface ShippingOption {
  id: string
  name: string
  amount: number
  priceType: string
}

export async function listShippingOptions(): Promise<ShippingOption[]> {
  const id = requireCartId()
  const { shipping_options } = await sdk.store.fulfillment.listCartOptions({
    cart_id: id,
  })
  return shipping_options.map((o) => ({
    id: o.id,
    name: o.name ?? "",
    amount: o.amount ?? 0,
    priceType: o.price_type ?? "flat",
  }))
}

export async function addShippingMethod(optionId: string): Promise<Cart> {
  const id = requireCartId()
  const { cart } = await sdk.store.cart.addShippingMethod(id, {
    option_id: optionId,
  })
  const fresh = await fetchExistingCart(cart.id)
  return transform(fresh ?? cart)
}

export interface PaymentProviderInfo {
  id: string
  isEnabled: boolean
}

export async function listPaymentProviders(): Promise<PaymentProviderInfo[]> {
  const id = requireCartId()
  // Pull region_id from cart so we filter providers correctly.
  const cart = await fetchExistingCart(id)
  const regionId = cart?.region_id
  if (!regionId) return []
  const { payment_providers } = await sdk.store.payment.listPaymentProviders({
    region_id: regionId,
  })
  return payment_providers.map((p) => ({
    id: p.id,
    isEnabled: (p as { is_enabled?: boolean }).is_enabled ?? true,
  }))
}

export interface ActivePaymentSession {
  id: string
  provider_id: string
  amount?: number
  /**
   * Provider-specific payload (e.g. Stripe `client_secret`, PayPal order ID).
   * Read what your chosen provider needs from here.
   */
  data: Record<string, unknown>
}

/**
 * Create a payment collection for the cart (if needed) and initiate a payment
 * session with the chosen provider. Returns the updated cart plus the active
 * session (so the storefront can render provider-specific UI like Stripe
 * Elements using `session.data.client_secret`).
 */
export async function initiatePaymentSession(
  providerId: string
): Promise<{ cart: Cart; session: ActivePaymentSession | null }> {
  const id = requireCartId()
  const cart = await fetchExistingCart(id)
  if (!cart) throw new Error("Cart not found")

  await sdk.store.payment.initiatePaymentSession(
    cart as HttpTypes.StoreCart,
    { provider_id: providerId }
  )

  const fresh = await fetchExistingCart(id)
  const session = findActiveSession(fresh, providerId)
  return { cart: transform(fresh ?? cart), session }
}

function findActiveSession(
  cart: StoreCart | null,
  providerId: string
): ActivePaymentSession | null {
  const pc = (cart as { payment_collection?: HttpTypes.StorePaymentCollection })
    ?.payment_collection
  const sessions =
    (pc as { payment_sessions?: HttpTypes.StorePaymentSession[] } | undefined)
      ?.payment_sessions ?? []
  const match = sessions.find((s) => s.provider_id === providerId) ?? sessions[0]
  if (!match) return null
  return {
    id: match.id,
    provider_id: match.provider_id ?? providerId,
    amount: match.amount as number | undefined,
    data: (match.data ?? {}) as Record<string, unknown>,
  }
}

/**
 * Complete the cart. Returns either an order (success) or a cart (failure
 * with details on what went wrong).
 */
export async function completeCart(): Promise<
  | { type: "order"; order: HttpTypes.StoreOrder }
  | { type: "cart"; cart: Cart; error?: string }
> {
  const id = requireCartId()
  const result = await sdk.store.cart.complete(id)
  if (result.type === "order") {
    clearCookie(CART_COOKIE)
    return { type: "order", order: result.order }
  }
  const fresh = await fetchExistingCart(id)
  return {
    type: "cart",
    cart: transform(fresh ?? (result.cart as StoreCart)),
    error: result.error?.message,
  }
}

/**
 * Retrieve an order by ID (used by the success page).
 */
export async function retrieveOrder(
  orderId: string
): Promise<HttpTypes.StoreOrder | null> {
  try {
    const { order } = await sdk.store.order.retrieve(orderId, {
      fields: "*items,*items.variant,*items.variant.product,*shipping_address,*billing_address",
    })
    return order
  } catch {
    return null
  }
}
