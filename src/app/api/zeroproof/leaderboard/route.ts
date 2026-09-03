import { proxyPublicList } from "@/lib/backendFetch";

// GET /api/zeroproof/leaderboard — ranked profiles by sharp score.
// Public. The backend wraps its rows in { board, entries }; the sharp board is
// the default, and the proxy forwards just the entries.
export async function GET() {
  return proxyPublicList("/api/zeroproof/leaderboard", {
    errorLabel: "Failed to fetch leaderboard",
    key: "entries",
  });
}
