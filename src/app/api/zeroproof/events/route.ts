import { proxyPublicList } from "@/lib/backendFetch";

// GET /api/zeroproof/events — upcoming events with their latest lines.
// `?include=past` also returns finished fixtures from the last 3 months.
// Public: the slate renders for signed-out visitors, and the backend serves it
// from the database only (no vendor call on user traffic).
export async function GET(request: Request) {
  const includePast =
    new URL(request.url).searchParams.get("include") === "past";
  const path = includePast
    ? "/api/zeroproof/events?include=past"
    : "/api/zeroproof/events";
  return proxyPublicList(path, {
    errorLabel: "Failed to fetch events",
    key: "events",
  });
}
