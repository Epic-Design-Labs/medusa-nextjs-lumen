import type { NextConfig } from "next";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";
import { redirects as redirectRules } from "./src/lib/redirects";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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

  // Redirects are defined in src/lib/redirects.ts — edit there.
  async redirects() {
    return redirectRules;
  },
};

export default withNextIntl(nextConfig);
