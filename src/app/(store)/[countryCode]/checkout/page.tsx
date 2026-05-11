"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useCartStore } from "@/store/cart"
import { CartSummary } from "@/components/cart/cart-summary"
import { formatPrice } from "@/lib/utils"
import {
  addShippingMethod,
  completeCart,
  initiatePaymentSession,
  listPaymentProviders,
  listShippingOptions,
  updateCartContact,
  type ActivePaymentSession,
  type CheckoutAddress,
  type PaymentProviderInfo,
  type ShippingOption,
} from "@/lib/cart-client"
import { PaymentProviderInput } from "@/components/checkout/payment-provider-input"

type Step = "address" | "shipping" | "payment"

const EMPTY_ADDRESS: CheckoutAddress = {
  first_name: "",
  last_name: "",
  address_1: "",
  address_2: "",
  city: "",
  province: "",
  postal_code: "",
  country_code: "",
  phone: "",
}

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams<{ countryCode: string }>()
  const countryCode = (params?.countryCode ?? "us").toLowerCase()

  const cart = useCartStore((s) => s.cart)
  const hasHydrated = useCartStore((s) => s.hasHydrated)
  const hydrate = useCartStore((s) => s.hydrate)

  useEffect(() => {
    if (!hasHydrated) void hydrate()
  }, [hasHydrated, hydrate])

  const [step, setStep] = useState<Step>("address")
  const [submitting, setSubmitting] = useState(false)

  const [email, setEmail] = useState("")
  const [address, setAddress] = useState<CheckoutAddress>({
    ...EMPTY_ADDRESS,
    country_code: countryCode,
  })

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<string>("")
  const [shippingError, setShippingError] = useState<string | null>(null)

  const [paymentProviders, setPaymentProviders] = useState<PaymentProviderInfo[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [activeSession, setActiveSession] = useState<ActivePaymentSession | null>(null)
  const [initiatingProvider, setInitiatingProvider] = useState<string | null>(null)

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
        <p className="mt-8 text-muted-foreground">
          Your cart is empty. Add some products before checking out.
        </p>
        <Button className="mt-8" asChild>
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    )
  }

  async function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (
      !email ||
      !address.first_name ||
      !address.last_name ||
      !address.address_1 ||
      !address.city ||
      !address.postal_code ||
      !address.country_code
    ) {
      toast.error("Please fill in all required fields")
      return
    }
    setSubmitting(true)
    try {
      await updateCartContact({ email, shipping_address: address })
      const options = await listShippingOptions()
      setShippingOptions(options)
      if (options.length === 0) {
        setShippingError(
          "No shipping options available for this region. Configure them in Medusa Admin → Settings → Shipping Profiles, then return here."
        )
      } else {
        setShippingError(null)
        setSelectedShipping(options[0].id)
      }
      setStep("shipping")
    } catch (err) {
      console.error(err)
      toast.error("Couldn't save address. Please check your details.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleShippingSubmit() {
    if (!selectedShipping) {
      toast.error("Please select a shipping method")
      return
    }
    setSubmitting(true)
    try {
      await addShippingMethod(selectedShipping)
      const providers = await listPaymentProviders()
      setPaymentProviders(providers)
      if (providers.length > 0) setSelectedProvider(providers[0].id)
      setStep("payment")
    } catch (err) {
      console.error(err)
      toast.error("Couldn't apply shipping method.")
    } finally {
      setSubmitting(false)
    }
  }

  async function ensurePaymentSession(providerId: string): Promise<ActivePaymentSession | null> {
    if (activeSession && activeSession.provider_id === providerId) {
      return activeSession
    }
    setInitiatingProvider(providerId)
    try {
      const { session } = await initiatePaymentSession(providerId)
      setActiveSession(session)
      return session
    } catch (err) {
      console.error(err)
      toast.error("Couldn't initiate payment. Try a different provider?")
      return null
    } finally {
      setInitiatingProvider(null)
    }
  }

  // Initiate session as soon as a provider is picked, so provider-specific UI
  // (Stripe Elements, etc.) can render with the necessary client_secret.
  async function handleProviderPick(providerId: string) {
    setSelectedProvider(providerId)
    await ensurePaymentSession(providerId)
  }

  /**
   * Final step: payment is already authorized on the provider's side (or the
   * provider didn't need client-side capture), so just complete the cart.
   * The PaymentProviderInput handles any client-side confirm step (Stripe
   * Elements, PayPal, etc.) before calling this.
   */
  async function handlePlaceOrder() {
    if (!selectedProvider) {
      toast.error("Please select a payment method")
      return
    }
    setSubmitting(true)
    try {
      // Make sure a session exists (e.g. if user picked then jumped back).
      const session = await ensurePaymentSession(selectedProvider)
      if (!session) return

      const result = await completeCart()
      if (result.type === "order") {
        useCartStore.setState({ cart: null, hasHydrated: false })
        router.push(`/${countryCode}/checkout/success?order_id=${result.order.id}`)
      } else {
        toast.error(result.error ?? "Could not complete checkout")
        await hydrate()
      }
    } catch (err) {
      console.error(err)
      toast.error("Payment failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-16 sm:px-6 sm:py-16 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
      <StepIndicator current={step} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {step === "address" && (
            <form onSubmit={handleAddressSubmit} className="space-y-6">
              <Card>
                <CardContent className="space-y-4 p-6">
                  <h2 className="text-lg font-semibold">Contact</h2>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4 p-6">
                  <h2 className="text-lg font-semibold">Shipping address</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="First name" value={address.first_name} onChange={(v) => setAddress({ ...address, first_name: v })} required />
                    <Field label="Last name" value={address.last_name} onChange={(v) => setAddress({ ...address, last_name: v })} required />
                  </div>
                  <Field label="Address line 1" value={address.address_1} onChange={(v) => setAddress({ ...address, address_1: v })} required />
                  <Field label="Address line 2" value={address.address_2 ?? ""} onChange={(v) => setAddress({ ...address, address_2: v })} />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="City" value={address.city} onChange={(v) => setAddress({ ...address, city: v })} required />
                    <Field label="State / Province" value={address.province ?? ""} onChange={(v) => setAddress({ ...address, province: v })} />
                    <Field label="Postal code" value={address.postal_code} onChange={(v) => setAddress({ ...address, postal_code: v })} required />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Country (ISO-2)" value={address.country_code} onChange={(v) => setAddress({ ...address, country_code: v.toLowerCase() })} required />
                    <Field label="Phone" value={address.phone ?? ""} onChange={(v) => setAddress({ ...address, phone: v })} />
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? "Saving…" : "Continue to shipping"}
              </Button>
            </form>
          )}

          {step === "shipping" && (
            <Card>
              <CardContent className="space-y-4 p-6">
                <h2 className="text-lg font-semibold">Shipping method</h2>
                {shippingError && (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                    {shippingError}
                  </div>
                )}
                {shippingOptions.length === 0 && !shippingError && (
                  <p className="text-sm text-muted-foreground">Loading options…</p>
                )}
                <div className="space-y-2">
                  {shippingOptions.map((o) => (
                    <label
                      key={o.id}
                      className={`flex items-center justify-between rounded-md border p-4 cursor-pointer transition-colors ${selectedShipping === o.id ? "border-foreground bg-neutral-50" : "border-border"}`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          value={o.id}
                          checked={selectedShipping === o.id}
                          onChange={() => setSelectedShipping(o.id)}
                        />
                        <span className="text-sm font-medium">{o.name}</span>
                      </div>
                      <span className="text-sm tabular-nums">
                        {o.priceType === "flat" ? formatPrice(o.amount, cart?.currency) : "Calculated"}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-between gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep("address")}>
                    Back
                  </Button>
                  <Button type="button" onClick={handleShippingSubmit} disabled={submitting || shippingOptions.length === 0}>
                    {submitting ? "Saving…" : "Continue to payment"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "payment" && (
            <Card>
              <CardContent className="space-y-6 p-6">
                <div>
                  <h2 className="text-lg font-semibold">Payment method</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Providers configured on your Medusa backend. Add Stripe,
                    PayPal, or others in Medusa Admin → Settings → Regions.
                  </p>
                </div>

                <div className="space-y-2">
                  {paymentProviders.map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-center justify-between rounded-md border p-4 cursor-pointer transition-colors ${selectedProvider === p.id ? "border-foreground bg-neutral-50" : "border-border"}`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="provider"
                          value={p.id}
                          checked={selectedProvider === p.id}
                          onChange={() => handleProviderPick(p.id)}
                        />
                        <span className="text-sm font-medium">{providerLabel(p.id)}</span>
                      </div>
                      <code className="text-xs text-muted-foreground">{p.id}</code>
                    </label>
                  ))}
                  {paymentProviders.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No payment providers available for this region. Add one
                      in Medusa Admin → Settings → Regions.
                    </p>
                  )}
                </div>

                {selectedProvider && (
                  <div className="border-t pt-6">
                    {initiatingProvider === selectedProvider ? (
                      <p className="text-sm text-muted-foreground">
                        Preparing {providerLabel(selectedProvider)}…
                      </p>
                    ) : (
                      <PaymentProviderInput
                        providerId={selectedProvider}
                        session={activeSession}
                        totalLabel={formatPrice(cart?.total ?? 0, cart?.currency)}
                        onSubmit={handlePlaceOrder}
                        submitting={submitting}
                      />
                    )}
                  </div>
                )}

                <div className="flex justify-between gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep("shipping")}>
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-semibold">Order summary</h2>
              <ul className="space-y-2 text-sm">
                {items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">
                      {i.quantity} × {i.name}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {formatPrice(i.lineTotal, cart?.currency)}
                    </span>
                  </li>
                ))}
              </ul>
              <Separator />
              {cart && <CartSummary cart={cart} />}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  type?: string
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? " *" : ""}
      </Label>
      <Input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function StepIndicator({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "address", label: "Address" },
    { id: "shipping", label: "Shipping" },
    { id: "payment", label: "Payment" },
  ]
  const currentIndex = steps.findIndex((s) => s.id === current)
  return (
    <ol className="mt-4 flex gap-2 text-xs sm:text-sm">
      {steps.map((s, i) => (
        <li key={s.id} className="flex items-center gap-2">
          <span
            className={
              i <= currentIndex
                ? "rounded-full bg-foreground px-2.5 py-1 font-medium text-background"
                : "rounded-full bg-muted px-2.5 py-1 text-muted-foreground"
            }
          >
            {i + 1}. {s.label}
          </span>
          {i < steps.length - 1 && (
            <span className="text-muted-foreground">›</span>
          )}
        </li>
      ))}
    </ol>
  )
}

function providerLabel(id: string): string {
  if (id === "pp_system_default") return "Manual (system default — no real payment)"
  if (id.includes("stripe")) return "Stripe"
  if (id.includes("paypal")) return "PayPal"
  return id
}
