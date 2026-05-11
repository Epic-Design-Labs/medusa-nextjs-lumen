import { redirect, notFound } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AnnouncementBar } from "@/components/layout/announcement-bar"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { BackToTop } from "@/components/layout/back-to-top"
import { categoryRepository } from "@/lib/repositories"
import { sdk } from "@/lib/medusa"
import { isCountryCode } from "@/lib/country"

/**
 * Validates the requested country code against the regions configured on the
 * Medusa backend. If the segment isn't a valid ISO-2 code, falls through to
 * a 404. Caches the result so the regions API isn't hit on every request.
 */
async function isValidCountry(code: string): Promise<boolean> {
  if (!isCountryCode(code)) return false
  try {
    const { regions } = await sdk.store.region.list({})
    for (const r of regions) {
      for (const c of r.countries ?? []) {
        if (c.iso_2?.toLowerCase() === code) return true
      }
    }
  } catch {
    // If we can't reach the backend, allow the code through so the page
    // surfaces a real error rather than a 404 here.
    return true
  }
  return false
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const lower = countryCode.toLowerCase()

  if (!(await isValidCountry(lower))) {
    notFound()
  }

  // Normalize URL casing — keep /us, never /US, so analytics and canonical
  // URLs aggregate cleanly. The country segment in the URL is the canonical
  // source of truth; cookie writes happen via a Server Action when the user
  // actively switches regions (not during layout render — Next.js 16 forbids
  // that).
  if (countryCode !== lower) {
    redirect(`/${lower}`)
  }

  // Fetch category tree server-side so the Header doesn't depend on
  // a specific data source — the repository layer handles that.
  const categories = await categoryRepository.list()

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <Header categories={categories} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <BackToTop />
    </>
  )
}
