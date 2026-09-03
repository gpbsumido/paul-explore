import { proxyPublicList } from "@/lib/backendFetch";

// GET /api/zeroproof/events — upcoming events with their latest lines.
// Public: the slate renders for signed-out visitors, and the backend serves it
// from the database only (no vendor call on user traffic).
export async function GET() {
  return proxyPublicList("/api/zeroproof/events", {
    errorLabel: "Failed to fetch events",
    key: "events",
  });
}
