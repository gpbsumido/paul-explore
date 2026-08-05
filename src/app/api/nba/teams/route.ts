import { proxyUpstream } from "@/lib/upstream";
import { API_URL } from "@/lib/apiUrl";

// Team list is static within a season — 5 minutes is a safe CDN window
const CACHE_CONTROL = "public, s-maxage=300";

export async function GET() {
  return proxyUpstream(`${API_URL}/api/nba/teams`, {
    errorLabel: "Failed to fetch teams",
    cacheControl: CACHE_CONTROL,
  });
}
