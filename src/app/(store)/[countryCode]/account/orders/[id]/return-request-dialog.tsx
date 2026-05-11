"use client"

import { useState } from "react"
import type { HttpTypes } from "@medusajs/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { requestReturn, type ReturnItemInput } from "@/lib/customer-client"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: HttpTypes.StoreOrder
}

/**
 * Customer-initiated return request. Lists items in the order with quantity
 * selectors and a free-form note. Submits via Medusa's store/return endpoint;
 * the merchant approves/rejects in Admin.
 */
export function ReturnRequestDialog({ open, onOpenChange, order }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const items = order.items ?? []
  const eligible = items.filter((i) => (i.quantity ?? 0) > 0)

  function setQty(lineId: string, qty: number, max: number) {
    setQuantities((q) => ({ ...q, [lineId]: Math.min(Math.max(qty, 0), max) }))
  }

  async function handleSubmit() {
    const returnItems: ReturnItemInput[] = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([line_item_id, quantity]) => ({ line_item_id, quantity }))

    if (returnItems.length === 0) {
      toast.error("Pick at least one item to return")
      return
    }

    setSubmitting(true)
    try {
      await requestReturn({
        order_id: order.id,
        items: returnItems,
        note: note || undefined,
      })
      toast.success("Return requested — we'll be in touch")
      onOpenChange(false)
      setQuantities({})
      setNote("")
    } catch (err) {
      console.error(err)
      toast.error("Couldn't submit return request")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request return</DialogTitle>
          <DialogDescription>
            Pick the items you&apos;d like to return. We&apos;ll review your request and
            follow up with return instructions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {eligible.map((i) => {
            const max = i.quantity ?? 0
            const qty = quantities[i.id] ?? 0
            return (
              <div
                key={i.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {i.product_title ?? i.title}
                  </p>
                  {i.variant_title && i.variant_title !== "Default" && (
                    <p className="text-xs text-muted-foreground">{i.variant_title}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {max} ordered
                  </p>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={max}
                  value={qty}
                  onChange={(e) => setQty(i.id, Number(e.target.value), max)}
                  className="h-9 w-20"
                  aria-label={`Quantity to return for ${i.product_title ?? i.title}`}
                />
              </div>
            )
          })}
          {eligible.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No eligible items in this order.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="note">Reason / note (optional)</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's the issue?"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
