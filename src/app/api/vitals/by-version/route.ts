import { proxyPublicList } from "@/lib/backendFetch";

// GET /api/vitals/by-version — returns { byVersion: VersionMetrics[] }
// P75 per metric for the last 5 versions, oldest→newest. Public (forwards the
// visitor's token when present, otherwise unauthenticated).
export async function GET() {
  return proxyPublicList("/api/vitals/by-version", {
    errorLabel: "Failed to fetch version metrics",
    key: "byVersion",
  });
}
