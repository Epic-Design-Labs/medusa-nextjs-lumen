"use client"

import { formatPrice } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import type { Cart } from "@/types"

interface CartSummaryProps {
  cart: Cart
}

/**
 * Renders the cart totals as computed authoritatively by Medusa. Tax and
 * shipping are not estimates — Medusa returns the exact values for the cart's
 * region. Promotions and gift cards (Phase 3.5) will be reflected in subtotal
 * and total when applied.
 */
export function CartSummary({ cart }: CartSummaryProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{formatPrice(cart.subtotal, cart.currency)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Shipping</span>
        <span>
          {cart.shipping > 0
            ? formatPrice(cart.shipping, cart.currency)
            : "Calculated at checkout"}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Tax</span>
        <span>{formatPrice(cart.tax, cart.currency)}</span>
      </div>
      <Separator />
      <div className="flex justify-between font-medium">
        <span>Total</span>
        <span>{formatPrice(cart.total, cart.currency)}</span>
      </div>
    </div>
  )
}
