// The anonymous identity a telemetry event carries: a hashed device id and a
// per-tab session id. Both are opaque — they identify a browser tab, not a
// person — and the device id only exists once the visitor has accepted the
// site's functional-cookie consent.

import { CONSENT_COOKIE, hasAcceptedConsent } from "@/lib/consent";

const ANON_KEY = "zp_anon_id";
const SESSION_KEY = "zp_session_id";

/** SHA-256 of a string, as lowercase hex. */
export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function readConsentCookie(): string | undefined {
  const match = document.cookie
    .split("; ")
    .find((pair) => pair.startsWith(`${CONSENT_COOKIE}=`));
  return match?.slice(CONSENT_COOKIE.length + 1);
}

/**
 * A stable, hashed, anonymous device id, or null when the visitor hasn't
 * accepted the functional-cookie consent — no id means no tracking. The stored
 * value is the SHA-256 of a random UUID, so even the raw UUID never touches
 * disk; it's an opaque device key, not a person.
 */
export async function getAnonId(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!hasAcceptedConsent(readConsentCookie())) return null;

  const existing = window.localStorage.getItem(ANON_KEY);
  if (existing) return existing;

  const hashed = await sha256Hex(crypto.randomUUID());
  window.localStorage.setItem(ANON_KEY, hashed);
  return hashed;
}

/** A per-tab session id, minted once per tab (sessionStorage) and reused. */
export function getSessionId(): string {
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_KEY, id);
  return id;
}
