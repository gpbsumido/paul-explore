"use client";

import { useState, useEffect } from "react";
import { m } from "framer-motion";
import { useHubReducedMotion } from "@/app/providers";

// A template re-mounts on every navigation, so this wraps each page and gives
// client-side navigations a short cross-fade. Two deliberate constraints:
//
//  1. Opacity only — no transform. A transform on an ancestor turns every
//     descendant `position: fixed`/`sticky` into something relative to this
//     element, which would break the sticky page headers. Opacity is safe.
//  2. The very first mount of the session does NOT fade. The landing hero is
//     painted in the server frame for LCP; starting it at opacity 0 until
//     hydration would push that back. Only later navigations animate.
let hasMountedOnce = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const reduced = useHubReducedMotion();
  // Read the module flag once, in a lazy initializer (a pure read), to decide
  // whether this is the session's first mount; the effect flips it afterwards.
  const [isFirstLoad] = useState(() => !hasMountedOnce);
  useEffect(() => {
    hasMountedOnce = true;
  }, []);

  // Someone who asked for less motion gets no page fade at all.
  if (reduced) return <>{children}</>;

  return (
    <m.div
      initial={isFirstLoad ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </m.div>
  );
}
