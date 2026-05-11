import "server-only"
import { cookies, headers } from "next/headers"
import { sdk, DEFAULT_REGION } from "./medusa"

const COUNTRY_COOKIE = "lumen_region"

interface ResolvedRegion {
  id: string
  currency: string
  countryCode: string
}

// Cached per country code so multiple repository methods within a single
// request don't each refetch the region list.
const regionsByCountry = new Map<string, Promise<ResolvedRegion | null>>()

async function fetchAllRegions() {
  const { regions } = await sdk.store.region.list({})
  return regions
}

let allRegionsPromise: ReturnType<typeof fetchAllRegions> | null = null

function getAllRegions() {
  if (!allRegionsPromise) allRegionsPromise = fetchAllRegions()
  return allRegionsPromise
}

/**
 * Read the country code the current request is scoped to. Resolution order:
 *   1. `x-country-code` header (set by proxy.ts after URL resolution)
 *   2. `lumen_region` cookie (proxy.ts also sets this)
 *   3. Env default
 */
export async function getCurrentCountryCode(): Promise<string> {
  try {
    const hs = await headers()
    const headerVal = hs.get("x-country-code")?.toLowerCase()
    if (headerVal && /^[a-z]{2}$/.test(headerVal)) return headerVal
  } catch {
    /* outside a request context, fall through */
  }
  try {
    const cookieStore = await cookies()
    const v = cookieStore.get(COUNTRY_COOKIE)?.value?.toLowerCase()
    if (v && /^[a-z]{2}$/.test(v)) return v
  } catch {
    /* same */
  }
  return DEFAULT_REGION.toLowerCase()
}

/**
 * Resolve a Medusa region for a given country code (or the current request's
 * country if not provided). Returns null if no matching region exists.
 */
export async function resolveRegion(
  countryCode?: string
): Promise<ResolvedRegion> {
  const code = (countryCode ?? (await getCurrentCountryCode())).toLowerCase()

  let cached = regionsByCountry.get(code)
  if (!cached) {
    cached = (async () => {
      const regions = await getAllRegions()
      const exact = regions.find((r) =>
        r.countries?.some((c) => c.iso_2 === code)
      )
      const fallback = regions[0]
      const region = exact ?? fallback
      if (!region) return null
      return {
        id: region.id,
        currency: region.currency_code ?? "usd",
        countryCode: exact ? code : fallback?.countries?.[0]?.iso_2 ?? code,
      }
    })()
    regionsByCountry.set(code, cached)
  }

  const resolved = await cached
  if (!resolved) {
    throw new Error(
      `No Medusa region found for "${code}". Configure at least one region in your backend.`
    )
  }
  return resolved
}
