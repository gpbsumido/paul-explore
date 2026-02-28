import path from "path";
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

// Pass ANALYZE=true on the CLI to open the treemap reports after the build.
// The --webpack flag is required because the analyzer does not work with Turbopack.
// Example: npm run analyze (which expands to ANALYZE=true next build --webpack)
// Three HTML files land in .next/analyze/: client, nodejs, and edge.
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Pin the tracing root to this package so Next.js does not climb up to a
  // parent directory that has its own lockfile. Without this, the build warns
  // about multiple lockfiles and may trace the wrong workspace root.
  outputFileTracingRoot: path.resolve(__dirname),
};

export default withBundleAnalyzer(nextConfig);
