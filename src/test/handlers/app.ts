import { http, HttpResponse } from "msw";

/**
 * Handlers for the app-wide endpoints that almost every page touches.
 *
 * These had none, so a full CI run logged 23 unmatched calls to the geo lookup
 * and 19 to the session endpoint. Unmatched is not harmless: the request
 * rejects, the component updates state after the test has moved on, and React
 * reports it as an update outside act(). Thirty of those warnings were being
 * read as noise when they were the visible half of missing coverage.
 *
 * The shapes mirror the real routes so a component gets a plausible answer
 * rather than a rejection.
 */
export const appHandlers = [
  // GET /api/me — the session probe. Signed out is the honest default for a
  // suite that does not authenticate.
  http.get("/api/me", () =>
    HttpResponse.json({ name: null, email: null, sub: null }),
  ),

  // GET /api/geo — visitor location, proxied through the backend in production.
  http.get("/api/geo", () =>
    HttpResponse.json({
      city: "Toronto",
      region: "Ontario",
      country: "CA",
      timezone: "America/Toronto",
    }),
  ),

  // GET /api/feature-flags — absolute, because the BFF calls the API for it.
  http.get("*/api/feature-flags", () => HttpResponse.json({ flags: [] })),
];
