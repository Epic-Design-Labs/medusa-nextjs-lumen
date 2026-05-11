"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthCardLayout } from "@/components/auth/auth-card-layout"
import { requestPasswordReset } from "@/lib/auth-client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await requestPasswordReset(email)
      // Treat all responses as success — the API intentionally doesn't reveal
      // whether the email exists (avoids user enumeration).
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <AuthCardLayout
        title="Check your email"
        subtitle={`If an account exists for ${email || "that address"}, we've sent a password reset link.`}
        footerText="Remember your password?"
        footerLinkText="Sign in"
        footerLinkHref="/auth/login"
      >
        <p className="text-sm text-muted-foreground">
          The link expires after a short window. Didn&apos;t get an email? Check
          your spam folder, or contact support if it doesn&apos;t arrive.
        </p>
      </AuthCardLayout>
    )
  }

  return (
    <AuthCardLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
      footerText="Remember your password?"
      footerLinkText="Sign in"
      footerLinkHref="/auth/login"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={submitting || !email}>
          {submitting ? "Sending…" : "Send Reset Link"}
        </Button>
      </form>
    </AuthCardLayout>
  )
}
