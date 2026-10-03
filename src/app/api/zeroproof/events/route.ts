import { proxyPublicList } from "@/lib/backendFetch";

// GET /api/zeroproof/events — upcoming events with their latest lines.
// `?include=past` also returns finished fixtures from the last 3 months, and
// `?aheadDays` caps how far out upcoming fixtures reach.
// Public: the slate renders for signed-out visitors, and the backend serves it
// from the database only (no vendor call on user traffic).
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const includePast = params.get("include") === "past";
  const pastDays = params.get("pastDays");
  const aheadDays = params.get("aheadDays");
  // Forward the past window too, so "load earlier" actually widens the backend
  // query as you scroll back — the backend clamps it (1–90 days). The ahead cap
  // keeps the backend from sending fixtures further out than the board shows.
  const query = new URLSearchParams();
  if (includePast) {
    query.set("include", "past");
    if (pastDays) query.set("pastDays", pastDays);
  }
  if (aheadDays) query.set("aheadDays", aheadDays);
  const qs = query.toString();
  return proxyPublicList(`/api/zeroproof/events${qs ? `?${qs}` : ""}`, {
    errorLabel: "Failed to fetch events",
    key: "events",
  });
}
