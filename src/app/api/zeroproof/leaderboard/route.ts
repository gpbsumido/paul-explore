import { proxyPublicList } from "@/lib/backendFetch";

// GET /api/zeroproof/leaderboard?board=sharp|roi — ranked profiles.
// Public. The backend wraps its rows in { board, entries }; the sharp board is
// the default, and the proxy forwards just the entries. A `board=roi` query
// ranks by return instead; anything else falls through to sharp on the backend.
export async function GET(request: Request) {
  const board =
    new URL(request.url).searchParams.get("board") === "roi" ? "roi" : "sharp";
  return proxyPublicList(`/api/zeroproof/leaderboard?board=${board}`, {
    errorLabel: "Failed to fetch leaderboard",
    key: "entries",
  });
}
