import { proxyUpstream } from "@/lib/upstream";
import { API_URL } from "@/lib/apiUrl";
import { type NextRequest } from "next/server";

// Player rosters don't change mid-session — CDN can hold this for 5 minutes
const CACHE_CONTROL = "public, s-maxage=300";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  return proxyUpstream(`${API_URL}/api/nba/players/${teamId}`, {
    errorLabel: "Failed to fetch players",
    cacheControl: CACHE_CONTROL,
  });
}
