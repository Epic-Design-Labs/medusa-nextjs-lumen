import type { NextConfig } from "next";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";
import { redirects as redirectRules } from "./src/lib/redirects";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Security headers — applied at the response layer by Next.js / the platform.
// Lives here instead of in proxy.ts so the storefront has no runtime
// middleware (cleaner deploy target for Cloud's OpenNext layer and for
// any other Node-restricted host).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // tighten in production
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    // Report-only in dev so a misconfigured CSP doesn't break local debugging.
    // Production builds inherit NODE_ENV=production and switch to enforce.
    key:
      process.env.NODE_ENV === "production"
        ? "Content-Security-Policy"
        : "Content-Security-Policy-Report-Only",
    value: CSP,
  },
];

const nextConfig: NextConfig = {
  // Pin Turbopack's workspace root to this project so Next doesn't get
  // confused by a parent directory's lockfile.
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    // Remote image domains allowed by next/image. Add the hostname your
    // Medusa backend uses if it isn't covered here.
    remotePatterns: [
      // Medusa demo / seed images
      { protocol: "https", hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com" },
      // Generic AWS S3
      { protocol: "https", hostname: "*.amazonaws.com" },
      // Medusa Cloud-hosted storage
      { protocol: "https", hostname: "*.medusajs.app" },
      { protocol: "https", hostname: "*.medusajs.site" },
      // Cloudflare R2
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      // DigitalOcean Spaces
      { protocol: "https", hostname: "*.digitaloceanspaces.com" },
    ],
  },

  async headers() {
    return [
      {
        // Apply security headers to every route, except static assets which
        // don't need them.
        source: "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
        headers: SECURITY_HEADERS,
      },
    ];
  },

  async redirects() {
    return redirectRules;
  },
};

export default withNextIntl(nextConfig);
