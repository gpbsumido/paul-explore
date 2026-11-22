import { signedInCatchAll } from "@/lib/backendFetch";

/**
 * Proxies `/api/practice/...` to portfolio_api's `/api/practice/...` with the
 * caller's own token, so interview-prep review progress is stored against the
 * person. withBackend answers 401 when nobody is signed in, which is the
 * playbook's cue to keep progress in localStorage instead.
 */
const practice = signedInCatchAll("practice", "/api/practice");

export const GET = practice("GET");
export const PUT = practice("PUT");
export const POST = practice("POST");
