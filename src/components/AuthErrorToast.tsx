"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { useHubReducedMotion } from "@/app/providers";

/** The onCallback in auth0.ts sends declined logins here with this flag. */
const PERMISSIONS = "permissions";

const AUTO_DISMISS_MS = 6_000;

/**
 * Shows a toast when a login was declined. Auth0 sends the user back to the page
 * they started on with ?authError=permissions (see the onCallback in
 * src/lib/auth0.ts), and this reads that flag and explains why they aren't
 * signed in. Dismissing is local state, so it doesn't rewrite the URL or break
 * the back button, mirroring InterviewNotice.
 */
export default function AuthErrorToast() {
  const denied = useSearchParams().get("authError") === PERMISSIONS;
  const [dismissed, setDismissed] = useState(false);
  const reduceMotion = useHubReducedMotion();

  useEffect(() => {
    if (!denied) return;
    const timer = setTimeout(() => setDismissed(true), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [denied]);

  const show = denied && !dismissed;

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
            <span>You can&rsquo;t log in without granting permissions.</span>
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
