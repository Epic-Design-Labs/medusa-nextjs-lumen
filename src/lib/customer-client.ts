"use client"

import type { HttpTypes } from "@medusajs/types"
import { sdk } from "./medusa"
import type { CheckoutAddress } from "./cart-client"

type Customer = HttpTypes.StoreCustomer
type StoreOrder = HttpTypes.StoreOrder
type CustomerAddress = HttpTypes.StoreCustomerAddress

const ORDER_FIELDS =
  "*items,*items.variant,*items.variant.product,*shipping_address,*billing_address,*summary"

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function listMyOrders(args: {
  limit?: number
  offset?: number
} = {}): Promise<{ orders: StoreOrder[]; count: number }> {
  const { orders, count } = await sdk.store.order.list({
    limit: args.limit ?? 20,
    offset: args.offset ?? 0,
    fields: ORDER_FIELDS,
  })
  return { orders, count: count ?? orders.length }
}

export async function retrieveMyOrder(id: string): Promise<StoreOrder | null> {
  try {
    const { order } = await sdk.store.order.retrieve(id, {
      fields: ORDER_FIELDS,
    })
    return order ?? null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Returns
// ---------------------------------------------------------------------------

export interface ReturnItemInput {
  line_item_id: string
  quantity: number
  reason_id?: string
  note?: string
}

/**
 * Initiate a customer return request for an order. The merchant approves the
 * return in Medusa Admin; this just creates the request.
 *
 * The Medusa JS SDK (v2.14.x) doesn't wrap the store/return endpoint yet —
 * we call it directly via the client. Update once `sdk.store.return.initiate`
 * lands in the SDK.
 */
export async function requestReturn(args: {
  order_id: string
  items: ReturnItemInput[]
  note?: string
}): Promise<void> {
  await sdk.client.fetch("/store/return", {
    method: "POST",
    body: {
      order_id: args.order_id,
      items: args.items,
      note: args.note,
    },
  })
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function updateProfile(args: {
  first_name?: string
  last_name?: string
  phone?: string
}): Promise<Customer> {
  const { customer } = await sdk.store.customer.update(args)
  return customer
}

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

export async function listMyAddresses(): Promise<CustomerAddress[]> {
  const { addresses } = await sdk.store.customer.listAddress({ limit: 100 })
  return addresses
}

export async function addMyAddress(
  address: CheckoutAddress & { is_default_shipping?: boolean; is_default_billing?: boolean }
): Promise<CustomerAddress[]> {
  const { customer } = await sdk.store.customer.createAddress(address)
  return customer.addresses ?? []
}

export async function updateMyAddress(
  id: string,
  address: Partial<CheckoutAddress & { is_default_shipping?: boolean; is_default_billing?: boolean }>
): Promise<CustomerAddress[]> {
  const { customer } = await sdk.store.customer.updateAddress(id, address)
  return customer.addresses ?? []
}

export async function deleteMyAddress(id: string): Promise<void> {
  await sdk.store.customer.deleteAddress(id)
}
