// ============================================================================
// Store Configuration — Single source of truth for all store-wide settings.
// Edit this file to customize the store name, contact info, social links, etc.
// ============================================================================

export const siteConfig = {
  // Branding
  name: "Lumen Starter for Medusa JS",
  tagline: "A modern Next.js storefront starter for Medusa.",
  description:
    "Lumen is an open-source Next.js storefront starter for Medusa, designed by Epic Design Labs. Deploy to Medusa Cloud or Vercel — native Medusa features wired end-to-end (catalog, multi-region pricing, cart, promotions, checkout, accounts, returns) with a pluggable payment layer that already speaks Stripe and PayPal.",

  // Announcement bar (set to "" to hide)
  announcement: "Free shipping on all orders over $75 — Shop now!",

  // URLs
  url: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",

  // Contact
  contact: {
    email: "support@epicdesignlabs.com",
    phone: "",
    address: {
      street: "",
      suite: "",
      city: "",
      state: "",
      zip: "",
    },
  },

  // Social links (set to "" to hide)
  social: {
    twitter: "https://x.com/epicdesignlabs",
    instagram: "https://instagram.com/epicdesignlabs",
    facebook: "https://facebook.com/epicdesignlabs",
    youtube: "",
    tiktok: "",
  },

  // Shipping
  freeShippingThreshold: 7500, // in cents ($75.00)
  taxRate: 0.08, // 8%

  // Currency & locale
  currency: "USD",
  locale: "en-US",

  // Legal
  copyrightYear: new Date().getFullYear(),
} as const

export type SiteConfig = typeof siteConfig
