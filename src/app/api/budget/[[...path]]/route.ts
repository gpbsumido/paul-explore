import { signedInCatchAll } from "@/lib/backendFetch";

/**
 * One proxy for the whole budgets domain rather than a file per endpoint. Every
 * `/api/budget/...` request forwards to `${API_URL}/api/budgets/...` with the
 * caller's own token attached, so the backend attributes the write to the
 * person, not to the BFF. withBackend supplies the token (401 if signed out),
 * which is why the page keeps its localStorage budget for anonymous visitors
 * and only syncs once someone is signed in.
 */
const budget = signedInCatchAll("budget", "/api/budgets");

export const GET = budget("GET");
export const POST = budget("POST");
export const PATCH = budget("PATCH");
export const DELETE = budget("DELETE");
