import { signedInCatchAll } from "@/lib/backendFetch";

/**
 * Proxies `/api/practice/...` to portfolio_api's `/api/practice/...` with the
 * caller's own token, so interview-prep review progress is stored against the
 * person. withBackend answers 401 when nobody is signed in, which is the
 * playbook's cue to keep progress in localStorage instead.
 */
const practice = signedInCatchAll("practice", "/api/practice", {
  // A full import is every problem in both modes, about 69 KB. The backend's
  // express.json takes up to 100 KB, so cap it there rather than at 64 KB, or
  // the heaviest users get a 413 on every load and can never clear it.
  maxBytes: 102_400,
});

export const GET = practice("GET");
export const PUT = practice("PUT");
export const POST = practice("POST");
