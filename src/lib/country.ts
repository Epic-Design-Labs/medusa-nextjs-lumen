import { cookies, headers } from "next/headers"

const COUNTRY_COOKIE = "lumen_region"
const DEFAULT_COUNTRY = (
  process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"
).toLowerCase()
const COUNTRY_RE = /^[a-z]{2}$/

export { COUNTRY_COOKIE, DEFAULT_COUNTRY }

/**
 * Server-side country detection. Resolution order:
 *   1. `lumen_region` cookie (user's last choice, persisted on visit)
 *   2. CDN-provided country headers (Vercel, Cloudflare, CloudFront, Akamai)
 *   3. Accept-Language country hint (`en-US` → `us`)
 *   4. NEXT_PUBLIC_DEFAULT_REGION env var
 *   5. "us"
 *
 * Use this in the `[countryCode]` layout to default a customer to their region
 * the first time they land on the site, and as the source for redirects when
 * a non-region path is visited.
 */
export async function detectCountry(): Promise<string> {
  const c = await cookies()
  const cookieValue = c.get(COUNTRY_COOKIE)?.value?.toLowerCase()
  if (cookieValue && COUNTRY_RE.test(cookieValue)) return cookieValue

  const h = await headers()
  const headerNames = [
    "x-vercel-ip-country",
    "cf-ipcountry",
    "cloudfront-viewer-country",
    "x-country-code",
  ]
  for (const name of headerNames) {
    const v = h.get(name)?.toLowerCase()
    if (v && COUNTRY_RE.test(v)) return v
  }

  const acceptLang = h.get("accept-language") ?? ""
  const langMatch = acceptLang.match(/[a-z]{2}-([A-Z]{2})/)
  if (langMatch) return langMatch[1].toLowerCase()

  return DEFAULT_COUNTRY
}

/**
 * Whether a string looks like a valid ISO-2 lowercase country code.
 * Used in route guards to distinguish a country segment from any other slug.
 */
export function isCountryCode(value: string | undefined): boolean {
  return !!value && COUNTRY_RE.test(value.toLowerCase())
}
