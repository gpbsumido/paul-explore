import { budgetSchema, type Budget } from "./types";

/**
 * Inviting someone to a budget, done the only way a browser-only app honestly
 * can: the invite link carries the budget itself, base64url-encoded in the
 * query string. Opening it imports the shared budget and adds you to it. This
 * is a point-in-time share, not live sync — that needs the backend the store is
 * already shaped for (reducers take an injected StorageLike). Until then, a link
 * is how two people end up on the same budget.
 */

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(token: string): string {
  const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Encode a budget into an opaque, URL-safe invite token. */
export function encodeInvite(budget: Budget): string {
  return toBase64Url(JSON.stringify(budget));
}

/** Decode an invite token back into a budget, or null if it isn't a valid one. */
export function decodeInvite(token: string): Budget | null {
  try {
    const parsed = budgetSchema.safeParse(JSON.parse(fromBase64Url(token)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** The full link a visitor copies to invite someone to this budget. */
export function buildInviteLink(budget: Budget, origin: string): string {
  return `${origin}/budget?join=${encodeInvite(budget)}`;
}

/** Pull the `join` token out of a location search string, if present. */
export function parseJoinToken(search: string): string | null {
  return new URLSearchParams(search).get("join");
}
