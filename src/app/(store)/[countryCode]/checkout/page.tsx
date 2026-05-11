"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCartStore } from "@/store/cart"
import { CartSummary } from "@/components/cart/cart-summary"
import { formatPrice } from "@/lib/utils"

export default function CheckoutPage() {
  const cart = useCartStore((s) => s.cart)
  const hasHydrated = useCartStore((s) => s.hasHydrated)
  const hydrate = useCartStore((s) => s.hydrate)

  useEffect(() => {
    if (!hasHydrated) void hydrate()
  }, [hasHydrated, hydrate])

  if (!hasHydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
      </div>
    )
  }

  const items = cart?.items ?? []

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Your cart is empty. Add some products before checking out.
          </p>
          <Button className="mt-8" asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Phase 4 will implement the full Medusa checkout flow:
  //   1. Set shipping address (sdk.store.cart.update)
  //   2. List shipping options for region (sdk.store.fulfillment.listCartOptions)
  //   3. Select shipping method (sdk.store.cart.addShippingMethod)
  //   4. Initiate payment session (sdk.store.payment.initiatePaymentSession)
  //   5. Capture payment via provider (Stripe Elements, or a Throttle iframe)
  //   6. Complete cart (sdk.store.cart.complete) → returns the order
  //
  // For now: a placeholder confirming the cart loaded correctly so you can
  // verify Phase 3 end-to-end while Phase 4 wiring happens.
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-16 sm:px-6 sm:py-16 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Cart loaded from Medusa — checkout flow is being wired up in Phase 4.
      </p>

      <Card className="mt-8">
        <CardContent className="space-y-6 p-6">
          <div className="text-sm">
            <div className="font-medium">
              {items.length} {items.length === 1 ? "item" : "items"} ready to check out
            </div>
            <ul className="mt-3 space-y-1 text-muted-foreground">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>
                    {item.quantity} × {item.name}
                    {item.variantName !== "Default" && (
                      <span className="ml-1 text-xs">({item.variantName})</span>
                    )}
                  </span>
                  <span className="font-medium text-foreground tabular-nums">
                    {formatPrice(item.lineTotal, cart?.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {cart && <CartSummary cart={cart} />}

          <div className="flex flex-col gap-3 border-t pt-6">
            <Button size="lg" disabled>
              Continue to payment (Phase 4)
            </Button>
            <Button variant="outline" asChild>
              <Link href="/cart">Back to cart</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
