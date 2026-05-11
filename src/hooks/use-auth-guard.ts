"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuthStore } from "@/store/auth"

/**
 * Client-side gate for account pages. Triggers a hydrate on mount and
 * redirects to the login page if no customer is authenticated.
 */
export function useAuthGuard() {
  const customer = useAuthStore((s) => s.customer)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const hydrate = useAuthStore((s) => s.hydrate)
  const router = useRouter()
  const params = useParams<{ countryCode?: string }>()
  const countryCode = params?.countryCode ?? "us"

  useEffect(() => {
    if (!hasHydrated) void hydrate()
  }, [hasHydrated, hydrate])

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace(`/${countryCode}/auth/login`)
    }
  }, [hasHydrated, isAuthenticated, router, countryCode])

  return {
    customer,
    isAuthenticated,
    isLoading: !hasHydrated,
    isReady: hasHydrated && isAuthenticated,
  }
}
