"use client"

import { useParams } from "next/navigation"

/**
 * Returns the country code from the current route ([countryCode]/...).
 * Defaults to the env-driven fallback when called outside a region-scoped
 * route (e.g. /not-found before a redirect).
 */
export function useCountryCode(): string {
  const params = useParams<{ countryCode?: string | string[] }>()
  const raw = Array.isArray(params?.countryCode)
    ? params.countryCode[0]
    : params?.countryCode
  return (
    raw?.toLowerCase() ||
    (process.env.NEXT_PUBLIC_DEFAULT_REGION ?? "us").toLowerCase()
  )
}

/**
 * Builds region-aware hrefs. Usage:
 *   const link = useCountryLink()
 *   <Link href={link("/cart")}>
 *
 * Returns the input path unchanged if it's already region-prefixed or
 * external (starts with http).
 */
export function useCountryLink() {
  const code = useCountryCode()
  return (path: string) => {
    if (!path) return `/${code}`
    if (/^https?:\/\//.test(path)) return path
    if (path === "/") return `/${code}`
    // Already region-prefixed? Trust caller.
    if (/^\/[a-z]{2}(\/|$)/.test(path)) return path
    return `/${code}${path.startsWith("/") ? path : `/${path}`}`
  }
}
