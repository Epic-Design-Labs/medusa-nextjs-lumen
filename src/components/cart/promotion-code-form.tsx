"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  applyPromotionCodes,
  getAppliedPromotionCodes,
} from "@/lib/cart-client"
import { useCartStore } from "@/store/cart"

/**
 * Promo code input + applied-code chips. Reads codes from the cart on mount,
 * applies new codes via Medusa, and rehydrates the cart store so totals
 * update everywhere.
 */
export function PromotionCodeForm() {
  const hydrate = useCartStore((s) => s.hydrate)
  const cart = useCartStore((s) => s.cart)
  const [codes, setCodes] = useState<string[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)

  // Sync applied codes whenever the cart changes (e.g. after add/remove items).
  useEffect(() => {
    if (!cart?.id) return
    let cancelled = false
    getAppliedPromotionCodes().then((c) => {
      if (!cancelled) setCodes(c)
    })
    return () => {
      cancelled = true
    }
  }, [cart?.id, cart?.subtotal])

  async function apply(next: string[]) {
    setBusy(true)
    try {
      await applyPromotionCodes(next)
      const applied = await getAppliedPromotionCodes()
      setCodes(applied)
      // Refresh the cart store so totals update.
      useCartStore.setState({ hasHydrated: false })
      await hydrate()
    } catch (err) {
      console.error(err)
      toast.error("Couldn't apply promotion code")
    } finally {
      setBusy(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    if (codes.includes(trimmed)) {
      toast("That code is already applied")
      setInput("")
      return
    }
    const next = [...codes, trimmed]
    await apply(next)
    // If Medusa rejected the code, it won't be in `applied` after the round-
    // trip; let the user know.
    setInput("")
    const verified = await getAppliedPromotionCodes()
    if (!verified.includes(trimmed)) {
      toast.error(`"${trimmed}" isn't a valid code`)
    } else {
      toast.success("Promotion applied")
    }
  }

  async function handleRemove(code: string) {
    await apply(codes.filter((c) => c !== code))
    toast("Promotion removed")
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Promo code"
          className="h-9"
          aria-label="Promotion code"
        />
        <Button type="submit" size="sm" variant="outline" disabled={busy || !input.trim()}>
          Apply
        </Button>
      </form>
      {codes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {codes.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
            >
              {c}
              <button
                type="button"
                onClick={() => handleRemove(c)}
                aria-label={`Remove ${c}`}
                className="rounded-full hover:bg-foreground/10"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
