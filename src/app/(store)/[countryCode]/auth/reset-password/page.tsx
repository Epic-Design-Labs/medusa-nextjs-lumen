"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthCardLayout } from "@/components/auth/auth-card-layout"
import { toast } from "sonner"
import { AuthError, completePasswordReset } from "@/lib/auth-client"

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const params = useParams<{ countryCode: string }>()
  const countryCode = params?.countryCode ?? "us"
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const emailFromLink = searchParams.get("email") ?? ""

  const [email, setEmail] = useState(emailFromLink)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      toast.error("Missing reset token — open the link from your email")
      return
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    if (password !== confirm) {
      toast.error("Passwords don't match")
      return
    }
    setSubmitting(true)
    try {
      await completePasswordReset({ email, password, token })
      toast.success("Password updated — please sign in")
      router.push(`/${countryCode}/auth/login`)
    } catch (err) {
      const message =
        err instanceof AuthError ? err.message : "Couldn't reset password"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCardLayout
      title="Choose a new password"
      subtitle="Enter the email this reset is for, plus your new password"
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
        </div>
        {!token && (
          <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            No reset token in the URL. Open the link from your password reset
            email to continue.
          </p>
        )}
        <Button type="submit" className="w-full" disabled={submitting || !token}>
          {submitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthCardLayout>
  )
}
