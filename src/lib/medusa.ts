import Medusa from "@medusajs/js-sdk"

const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

if (!backendUrl) {
  throw new Error(
    "NEXT_PUBLIC_MEDUSA_BACKEND_URL is not set. See .env.example."
  )
}

if (!publishableKey) {
  throw new Error(
    "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is not set. See .env.example."
  )
}

// Auth storage: localStorage in the browser (persistent across refreshes),
// in-memory on the server (no localStorage available there). The SDK module
// is loaded separately in each environment, so each evaluates this branch
// once at boot.
const isBrowser = typeof window !== "undefined"

export const sdk = new Medusa({
  baseUrl: backendUrl,
  publishableKey,
  debug: process.env.NODE_ENV === "development",
  auth: {
    type: "jwt",
    jwtTokenStorageMethod: isBrowser ? "local" : "memory",
  },
})

export const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION ?? "us"
