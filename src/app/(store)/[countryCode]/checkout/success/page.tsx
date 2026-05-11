"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { HttpTypes } from "@medusajs/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckCircle } from "lucide-react"
import { formatPrice, formatDate } from "@/lib/utils"
import { retrieveOrder } from "@/lib/cart-client"

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <CheckoutSuccessContent />
    </Suspense>
  )
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")

  const [order, setOrder] = useState<HttpTypes.StoreOrder | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!orderId) {
      setLoaded(true)
      return
    }
    let cancelled = false
    retrieveOrder(orderId).then((o) => {
      if (!cancelled) {
        setOrder(o)
        setLoaded(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [orderId])

  if (!loaded) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Loading…</h1>
        </div>
      </div>
    )
  }

  const currency = (order?.currency_code ?? "usd").toLowerCase()

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <CheckCircle className="h-16 w-16 text-green-600" />
        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          Thank you for your order!
        </h1>
        <p className="mt-4 text-muted-foreground">
          {order
            ? "Your order has been placed. A confirmation email is on its way."
            : "Your order has been placed."}
        </p>

        {order && (
          <Card className="mt-8 w-full text-left">
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order number</span>
                <span className="font-medium">
                  {order.display_id ? `#${order.display_id}` : order.id}
                </span>
              </div>
              {order.created_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
              )}
              <Separator />
              {(order.items ?? []).map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.product_title ?? item.title} &times; {item.quantity}
                  </span>
                  <span>{formatPrice(item.subtotal ?? 0, currency)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal ?? 0, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {(order.shipping_total ?? 0) === 0
                    ? "Free"
                    : formatPrice(order.shipping_total ?? 0, currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatPrice(order.tax_total ?? 0, currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatPrice(order.total ?? 0, currency)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 flex gap-4">
          <Button asChild>
            <Link href="/account/orders">View Orders</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
