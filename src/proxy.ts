import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const COUNTRY_COOKIE = "lumen_region"
const DEFAULT_COUNTRY = (
  process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"
).toLowerCase()
const COUNTRY_RE = /^[a-z]{2}$/

/**
 * Picks the country code for an incoming request. Resolution order:
 *   1. `lumen_region` cookie (user's last choice, persisted on click)
 *   2. CDN-provided country headers (Vercel, Cloudflare, CloudFront, Akamai)
 *   3. Accept-Language country hint (`en-US` → `us`)
 *   4. NEXT_PUBLIC_DEFAULT_REGION env var
 *   5. "us"
 */
function pickCountry(req: NextRequest): string {
  const cookie = req.cookies.get(COUNTRY_COOKIE)?.value?.toLowerCase()
  if (cookie && COUNTRY_RE.test(cookie)) return cookie

  const headerNames = [
    "x-vercel-ip-country", // Vercel
    "cf-ipcountry", // Cloudflare
    "cloudfront-viewer-country", // CloudFront
    "x-country-code", // generic
  ]
  for (const name of headerNames) {
    const v = req.headers.get(name)?.toLowerCase()
    if (v && COUNTRY_RE.test(v)) return v
  }

  const acceptLang = req.headers.get("accept-language") ?? ""
  const langMatch = acceptLang.match(/[a-z]{2}-([A-Z]{2})/)
  if (langMatch) return langMatch[1].toLowerCase()

  return DEFAULT_COUNTRY
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "on",
  "Strict-Transport-Security":
    "max-age=63072000; includeSubDomains; preload",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // tighten in production
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
].join("; ")

function applyHeaders(resp: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    resp.headers.set(k, v)
  }
  if (process.env.NODE_ENV === "production") {
    resp.headers.set("Content-Security-Policy", CSP)
  } else {
    resp.headers.set("Content-Security-Policy-Report-Only", CSP)
  }
  return resp
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const country = pickCountry(request)

  // First path segment, if any.
  const segments = pathname.split("/").filter(Boolean)
  const first = segments[0]?.toLowerCase()
  const firstLooksLikeCountry = !!first && COUNTRY_RE.test(first)

  // / → /<country>
  if (segments.length === 0) {
    const url = request.nextUrl.clone()
    url.pathname = `/${country}`
    const resp = NextResponse.redirect(url)
    resp.cookies.set(COUNTRY_COOKIE, country, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    })
    return applyHeaders(resp)
  }

  // Path already region-prefixed — pass through. Forward x-country-code so
  // server components can read it immediately (cookie alone isn't set until
  // the response, so the FIRST request to a region URL needs the header).
  if (firstLooksLikeCountry) {
    const forwardHeaders = new Headers(request.headers)
    forwardHeaders.set("x-country-code", first)

    const existing = request.cookies.get(COUNTRY_COOKIE)?.value
    const resp = NextResponse.next({ request: { headers: forwardHeaders } })
    if (existing !== first) {
      resp.cookies.set(COUNTRY_COOKIE, first, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      })
    }
    return applyHeaders(resp)
  }

  // Non-region path (e.g. /shop bookmarked from a pre-region build).
  // Redirect to /<country>/<path> so old links keep working.
  const url = request.nextUrl.clone()
  url.pathname = `/${country}${pathname}`
  const resp = NextResponse.redirect(url)
  resp.cookies.set(COUNTRY_COOKIE, country, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
  return applyHeaders(resp)
}

export const config = {
  // Skip Next internals, API routes, the admin route group, static files,
  // and the special files we want untouched (robots, sitemap, favicon).
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|images|api|admin|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
