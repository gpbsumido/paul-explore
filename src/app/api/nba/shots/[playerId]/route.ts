import { proxyUpstream } from "@/lib/upstream";
import { API_URL } from "@/lib/apiUrl";
import { safeSegment } from "@/lib/safeSegment";

// Shot data is seasonal and doesn't change often — 24hr CDN cache
const CACHE_CONTROL = "public, s-maxage=86400";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ playerId: string }> },
) {
  const { playerId } = await params;
  return proxyUpstream(`${API_URL}/api/nba/shots/${safeSegment(playerId)}`, {
    errorLabel: "Failed to fetch shot data",
    cacheControl: CACHE_CONTROL,
  });
}
