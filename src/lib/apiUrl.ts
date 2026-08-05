// The portfolio_api base URL, read once at module load.
//
// This lives in its own dependency-free module (not in backendFetch.ts, which
// imports auth0 + next/server) so client modules and client pages can import
// the URL without dragging server-only code into their bundle. backendFetch
// re-exports it, so server code can keep importing it from either place.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
