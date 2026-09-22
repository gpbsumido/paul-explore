import { proxyPublicList } from "@/lib/backendFetch";

// GET /api/zeroproof/events — upcoming events with their latest lines.
// `?include=past` also returns finished fixtures from the last 3 months.
// Public: the slate renders for signed-out visitors, and the backend serves it
// from the database only (no vendor call on user traffic).
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const includePast = params.get("include") === "past";
  const pastDays = params.get("pastDays");
  // Forward the past window too, so "load earlier" actually widens the backend
  // query as you scroll back — the backend clamps it (1–90 days).
  const query = includePast
    ? `?include=past${pastDays ? `&pastDays=${encodeURIComponent(pastDays)}` : ""}`
    : "";
  return proxyPublicList(`/api/zeroproof/events${query}`, {
    errorLabel: "Failed to fetch events",
    key: "events",
  });
}
