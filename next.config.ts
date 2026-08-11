import path from "path";
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import { securityHeaders } from "./src/lib/securityHeaders";

// Pass ANALYZE=true on the CLI to open the treemap reports after the build.
// The --webpack flag is required because the analyzer does not work with Turbopack.
// Example: pnpm analyze (which expands to ANALYZE=true next build --webpack)
// Three HTML files land in .next/analyze/: client, nodejs, and edge.
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Pin the tracing root to this package so Next.js does not climb up to a
  // parent directory that has its own lockfile. Without this, the build warns
  // about multiple lockfiles and may trace the wrong workspace root.
  outputFileTracingRoot: path.resolve(__dirname),

  experimental: {
    // Rewrite barrel imports (import { X } from "pkg") into direct-module
    // imports so unused members never enter the graph. Next already does this
    // for a built-in list (recharts, date-fns, lucide-react, and friends), so
    // we only name the barrels it does NOT cover: our own design-system
    // package, the two big charting/3D barrels, and framer-motion. Everything
    // here was confirmed as a real barrel (single entry, many members) before
    // adding it. See /thoughts/tree-shaking-2.
    optimizePackageImports: [
      "@paul-portfolio/react",
      "@react-three/drei",
      "@unovis/react",
      "framer-motion",
    ],
  },

  async headers() {
    return [
      {
        source: "/models/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Static security headers on every route. The dynamic CSP is set per
      // response in src/proxy.ts; these are the ones CSP does not cover.
      {
        source: "/:path*",
        headers: securityHeaders(),
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
