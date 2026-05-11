"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import type { HttpTypes } from "@medusajs/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/ui/page-header"
import { useAuthGuard } from "@/hooks/use-auth-guard"
import { useCountryLink } from "@/hooks/use-country-link"
import { retrieveMyOrder } from "@/lib/customer-client"
import { formatPrice, formatDate } from "@/lib/utils"
import { ReturnRequestDialog } from "./return-request-dialog"

type StoreOrder = HttpTypes.StoreOrder

export default function OrderDetailPage() {
  const { isReady } = useAuthGuard()
  const params = useParams<{ countryCode: string; id: string }>()
  const id = params?.id ?? ""
  const link = useCountryLink()

  const [order, setOrder] = useState<StoreOrder | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)

  useEffect(() => {
    if (!isReady || !id) return
    let cancelled = false
    retrieveMyOrder(id).then((o) => {
      if (!cancelled) {
        setOrder(o)
        setLoaded(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [isReady, id])

  if (!isReady) return null
  if (!loaded) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <PageHeader title="Order" description="Loading…" />
      </div>
    )
  }
  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <PageHeader title="Order not found" />
        <Button asChild className="mt-6">
          <Link href={link("/account/orders")}>Back to orders</Link>
        </Button>
      </div>
    )
  }

  const currency = (order.currency_code ?? "usd").toLowerCase()
  const items = order.items ?? []
  const orderLabel = order.display_id ? `#${order.display_id}` : order.id

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader
        title={`Order ${orderLabel}`}
        description={order.created_at ? formatDate(order.created_at) : undefined}
      >
        <Button variant="outline" onClick={() => setReturnOpen(true)}>
          Request return
        </Button>
      </PageHeader>

      <Card className="mt-8">
        <CardContent className="space-y-4 p-6">
          <div className="text-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Items
            </p>
            <ul className="mt-2 space-y-2">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between text-sm">
                  <span>
                    {i.quantity} × {i.product_title ?? i.title}
                    {i.variant_title && i.variant_title !== "Default" && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({i.variant_title})
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums">
                    {formatPrice(i.subtotal ?? 0, currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(order.subtotal ?? 0, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{formatPrice(order.shipping_total ?? 0, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatPrice(order.tax_total ?? 0, currency)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatPrice(order.total ?? 0, currency)}</span>
            </div>
          </div>

          {order.shipping_address && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Shipping address
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {order.shipping_address.first_name} {order.shipping_address.last_name}
                  <br />
                  {order.shipping_address.address_1}
                  {order.shipping_address.address_2 ? `, ${order.shipping_address.address_2}` : ""}
                  <br />
                  {order.shipping_address.city}
                  {order.shipping_address.province ? `, ${order.shipping_address.province}` : ""}{" "}
                  {order.shipping_address.postal_code}
                  <br />
                  {order.shipping_address.country_code?.toUpperCase()}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button variant="outline" asChild>
          <Link href={link("/account/orders")}>← All orders</Link>
        </Button>
      </div>

      <ReturnRequestDialog
        open={returnOpen}
        onOpenChange={setReturnOpen}
        order={order}
      />
    </div>
  )
}
