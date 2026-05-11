"use client"

import { useState, type FormEvent } from "react"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe, type Stripe } from "@stripe/stripe-js"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import type {
  OnApproveData,
  OnApproveActions,
} from "@paypal/paypal-js"
import { Button } from "@/components/ui/button"
import type { ActivePaymentSession } from "@/lib/cart-client"

export interface ProviderInputProps {
  /** The provider id chosen by the customer (e.g. "pp_stripe_stripe"). */
  providerId: string
  /** Payment session returned by initiatePaymentSession — provider-specific data. */
  session: ActivePaymentSession | null
  /** Pretty total to render on the submit button. */
  totalLabel: string
  /** Submit handler — orchestrates provider confirm + cart.complete. */
  onSubmit: () => Promise<void>
  /** Loading state for the submit button. */
  submitting: boolean
}

/**
 * Renders the right payment input for whichever Medusa payment provider the
 * customer picked. New providers (PayPal, Throttle, etc.) plug in here without
 * touching the checkout flow.
 */
export function PaymentProviderInput(props: ProviderInputProps) {
  if (isStripeProviderId(props.providerId)) {
    return <StripePayment {...props} />
  }
  if (isPayPalProviderId(props.providerId)) {
    return <PayPalPayment {...props} />
  }
  if (props.providerId === "pp_system_default") {
    return <SystemDefaultPayment {...props} />
  }
  return <GenericPayment {...props} />
}

function isStripeProviderId(id: string): boolean {
  return id.startsWith("pp_stripe") || id === "pp_stripe_stripe"
}

function isPayPalProviderId(id: string): boolean {
  return id.startsWith("pp_paypal")
}

// ---------------------------------------------------------------------------
// pp_system_default — manual payment, useful for demos and as a fallback
// ---------------------------------------------------------------------------

function SystemDefaultPayment({ onSubmit, submitting, totalLabel }: ProviderInputProps) {
  return (
    <div className="space-y-4">
      <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        Manual payment provider (test mode) — no real card is charged.
        Configure Stripe, PayPal, or another provider on your Medusa backend
        for production checkout.
      </p>
      <Button onClick={onSubmit} disabled={submitting} size="lg" className="w-full">
        {submitting ? "Placing order…" : `Place order — ${totalLabel}`}
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Unknown provider — let the user click Place Order; the backend's provider
// will reject if it needs client-side confirmation we haven't wired up.
// ---------------------------------------------------------------------------

function GenericPayment({ onSubmit, submitting, totalLabel, providerId }: ProviderInputProps) {
  return (
    <div className="space-y-4">
      <p className="rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
        Payment provider <code className="rounded bg-background px-1">{providerId}</code> uses
        a server-side flow. Click Place order to continue. If the provider
        requires client-side confirmation, add a renderer in
        <code className="ml-1 rounded bg-background px-1">payment-provider-input.tsx</code>.
      </p>
      <Button onClick={onSubmit} disabled={submitting} size="lg" className="w-full">
        {submitting ? "Placing order…" : `Place order — ${totalLabel}`}
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stripe — Payment Element + confirmPayment
// ---------------------------------------------------------------------------

let stripePromise: Promise<Stripe | null> | null = null
function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_KEY
    stripePromise = key ? loadStripe(key) : Promise.resolve(null)
  }
  return stripePromise
}

function StripePayment({ session, onSubmit, submitting, totalLabel }: ProviderInputProps) {
  const clientSecret =
    typeof session?.data.client_secret === "string"
      ? (session.data.client_secret as string)
      : undefined

  if (!process.env.NEXT_PUBLIC_STRIPE_KEY) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
        Stripe is configured on the Medusa backend but{" "}
        <code>NEXT_PUBLIC_STRIPE_KEY</code> is not set on the storefront.
        Add your Stripe publishable key to <code>.env.local</code> and reload.
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
        Couldn&apos;t get a Stripe client secret from the payment session.
        Check that Stripe is configured on the Medusa backend.
      </div>
    )
  }

  return (
    <Elements
      stripe={getStripe()}
      options={{ clientSecret, appearance: { theme: "stripe" } }}
    >
      <StripeForm onSubmit={onSubmit} submitting={submitting} totalLabel={totalLabel} />
    </Elements>
  )
}

interface StripeFormProps {
  onSubmit: () => Promise<void>
  submitting: boolean
  totalLabel: string
}

function StripeForm({ onSubmit, submitting, totalLabel }: StripeFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [stripeError, setStripeError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setConfirming(true)
    setStripeError(null)

    // confirmPayment with no redirect — succeeds or returns an error inline.
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    })

    if (confirmError) {
      setStripeError(confirmError.message ?? "Payment failed")
      setConfirming(false)
      return
    }

    // Payment intent succeeded — complete the cart on Medusa's side.
    try {
      await onSubmit()
    } catch (err) {
      setStripeError(
        (err as { message?: string })?.message ?? "Order could not be completed"
      )
    } finally {
      setConfirming(false)
    }
  }

  const isSubmitting = submitting || confirming

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {stripeError && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {stripeError}
        </p>
      )}
      <Button
        type="submit"
        disabled={!stripe || !elements || isSubmitting}
        size="lg"
        className="w-full"
      >
        {isSubmitting ? "Processing…" : `Pay ${totalLabel}`}
      </Button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// PayPal — Smart Buttons + onApprove
// ---------------------------------------------------------------------------

function PayPalPayment({ session, onSubmit, submitting }: ProviderInputProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const orderId =
    typeof session?.data.id === "string" ? (session.data.id as string) : undefined

  if (!clientId) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
        PayPal is configured on the Medusa backend but{" "}
        <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> is not set on the storefront.
        Add it to <code>.env.local</code> and reload.
      </div>
    )
  }

  if (!orderId) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
        Couldn&apos;t get a PayPal order id from the payment session. Check that
        PayPal is configured on the Medusa backend.
      </div>
    )
  }

  async function onApprove(_data: OnApproveData, actions: OnApproveActions) {
    // Capture on PayPal's side, then complete the cart on Medusa.
    if (actions.order) {
      try {
        await actions.order.capture()
      } catch (err) {
        console.error("PayPal capture failed", err)
        return
      }
    }
    await onSubmit()
  }

  return (
    <div className="space-y-3">
      <PayPalScriptProvider
        options={{
          clientId,
          currency: (typeof session?.data.currency_code === "string"
            ? (session.data.currency_code as string)
            : "USD"
          ).toUpperCase(),
          intent: "capture",
        }}
      >
        <PayPalButtons
          disabled={submitting}
          createOrder={() => Promise.resolve(orderId)}
          onApprove={onApprove}
          style={{ layout: "vertical" }}
        />
      </PayPalScriptProvider>
    </div>
  )
}
