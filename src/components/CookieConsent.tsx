"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CONSENT_COOKIE,
  CONSENT_ACCEPTED,
  CONSENT_DECLINED,
  CONSENT_COOKIE_MAX_AGE,
  type ConsentValue,
} from "@/lib/consent";

/** Reads a cookie value by name from document.cookie, or null. */
function readCookie(name: string): string | null {
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

// The stored choice is read through useSyncExternalStore rather than an effect,
// so the client value resolves before paint: a visitor who already chose never
// sees a flash of the banner, and there is no server/client mismatch. The
// choice only changes via this component's own buttons, so there is nothing
// external to subscribe to.
const subscribe = (): (() => void) => () => {};
const getConsent = (): string | null => readCookie(CONSENT_COOKIE);
const getServerConsent = (): string | null => null;

/** Persists the choice. `secure` only over https so the write still lands in a
 * plain-http test/dev context. */
function writeConsent(value: ConsentValue): void {
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; secure"
      : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; max-age=${CONSENT_COOKIE_MAX_AGE}; path=/; samesite=lax${secure}`;
}

/**
 * The consent banner for the one non-essential cookie (visitor_id). It shows
 * only until a choice is stored. Accepting lets the middleware mint visitor_id
 * on the next request, so it triggers a refresh; declining leaves the site
 * running without it (flag rollouts fall back to a default, the backend
 * rate-limits on IP). Nothing non-essential is stored before a choice.
 */
export default function CookieConsent() {
  const stored = useSyncExternalStore(
    subscribe,
    getConsent,
    getServerConsent,
  );
  const [justChose, setJustChose] = useState(false);
  const router = useRouter();

  // Show only when no choice is on record and the visitor has not just made one.
  if (justChose || stored) return null;

  const accept = () => {
    writeConsent(CONSENT_ACCEPTED);
    setJustChose(true);
    router.refresh();
  };

  const decline = () => {
    writeConsent(CONSENT_DECLINED);
    setJustChose(true);
  };

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface-raised/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 p-4 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted">
          This site uses one functional cookie to keep feature rollouts
          consistent for you. Nothing is set until you choose. See the{" "}
          <Link
            href="/privacy"
            className="text-primary-600 underline hover:no-underline dark:text-primary-400"
          >
            privacy notice
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={decline}
            className="paul-touch-min rounded-md border border-border px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-500"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={accept}
            className="paul-touch-min rounded-md bg-primary-600 px-3 py-1.5 font-medium text-white transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-500"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
