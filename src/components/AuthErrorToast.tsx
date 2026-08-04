"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { useHubReducedMotion } from "@/app/providers";

/**
 * Messages for each ?authError the auth flow sends the user back with:
 * "permissions" from a declined consent (onCallback in src/lib/auth0.ts),
 * "timeout" from an expired session (the proxy).
 */
const MESSAGES: Record<string, string> = {
  permissions: "You can't log in without granting permissions.",
  timeout: "Your session timed out. Please log in again.",
};

const AUTO_DISMISS_MS = 6_000;

/**
 * Shows a toast when the auth flow bounced the user back with an ?authError:
 * a declined login or an expired session. Dismissing is local state, so it
 * doesn't rewrite the URL or break the back button, mirroring InterviewNotice.
 */
export default function AuthErrorToast() {
  const code = useSearchParams().get("authError");
  const message = code ? MESSAGES[code] : undefined;
  const [dismissed, setDismissed] = useState(false);
  const reduceMotion = useHubReducedMotion();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setDismissed(true), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [message]);

  const show = Boolean(message) && !dismissed;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {show && (
          <m.div
            role="alert"
            aria-live="assertive"
            className="pointer-events-auto flex items-center gap-3 rounded-lg bg-error-600 px-4 py-3 text-sm font-medium text-white shadow-lg"
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          >
            <span>{message}</span>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded p-0.5 text-white/80 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Dismiss"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
