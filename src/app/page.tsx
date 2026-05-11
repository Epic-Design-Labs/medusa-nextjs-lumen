import { redirect } from "next/navigation"
import { detectCountry } from "@/lib/country"

/**
 * Bare `/` lands here. Detects the visitor's country (cookie → CDN header →
 * Accept-Language → env default) and redirects into the country-prefixed
 * route tree. Replaces the proxy.ts redirect we used pre-Edge-deploy.
 */
export default async function RootPage() {
  const country = await detectCountry()
  redirect(`/${country}`)
}
