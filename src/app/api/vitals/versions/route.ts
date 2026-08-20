import { proxyPublicList } from "@/lib/backendFetch";

// GET /api/vitals/versions — returns { versions: string[] }
// Public (forwards the visitor's token when present, otherwise unauthenticated).
export async function GET() {
  return proxyPublicList("/api/vitals/versions", {
    errorLabel: "Failed to fetch versions",
    key: "versions",
  });
}
