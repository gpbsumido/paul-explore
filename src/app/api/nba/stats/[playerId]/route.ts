import { proxyUpstream } from "@/lib/upstream";
import { API_URL } from "@/lib/apiUrl";
import { type NextRequest } from "next/server";

// Stats update daily at most — 5 min CDN cache keeps the NBA API rate limits comfortable
const CACHE_CONTROL = "public, s-maxage=300";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> },
) {
  const { playerId } = await params;
  return proxyUpstream(`${API_URL}/api/nba/stats/${playerId}`, {
    errorLabel: "Failed to fetch stats",
    cacheControl: CACHE_CONTROL,
  });
}
