"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { APP_VERSION } from "@/lib/appVersion";
import { getAnonId, getSessionId } from "@/lib/zeroproof/anonId";
import { createTracker, createTransport, type Tracker } from "@/lib/zeroproof/tracker";
import { createQueueStore } from "@/lib/zeroproof/trackerStore";
import { setActiveTracker, setTrackerPage } from "@/lib/zeroproof/trackerClient";

const TRACK_URL = "/api/zeroproof/track";

/**
 * Mounts the ZeroProof telemetry tracker for the whole `/zeroproof` segment.
 * Renders nothing. Because it lives in the segment layout it survives client
 * navigations within ZeroProof, so the queue and session sequence persist as
 * the visitor moves between the lobby, leagues and admin views.
 *
 * The tracker is created only once a hashed anon id resolves — which only
 * happens after the visitor has accepted the cookie consent — so a
 * non-consenting or signed-out visitor is never tracked. It flushes on
 * `visibilitychange → hidden` (and `pagehide` for older Safari) via sendBeacon,
 * the last event a backgrounded mobile tab reliably fires.
 */
export default function ZeroProofTracker() {
  const pathname = usePathname();
  // Read the live path from a ref inside the mount-once effect so it doesn't
  // have to depend on `pathname` (which would re-run the whole setup on every
  // navigation). The path effect below keeps the ref current.
  const pathnameRef = useRef(pathname);
  const trackerRef = useRef<Tracker | null>(null);

  useEffect(() => {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return;

    let cancelled = false;

    const flushOnExit = () => {
      if (document.visibilityState === "hidden") {
        trackerRef.current?.flush({ beacon: true });
      }
    };
    const flushOnPageHide = () => trackerRef.current?.flush({ beacon: true });

    void getAnonId().then((anonId) => {
      if (cancelled || !anonId) return;

      const sessionId = getSessionId();
      const tracker = createTracker({
        transport: createTransport(TRACK_URL),
        store: createQueueStore(sessionId),
        now: () => Date.now(),
        newUuid: () => crypto.randomUUID(),
        random: () => Math.random(),
        setTimer: (fn, ms) => window.setTimeout(fn, ms),
        clearTimer: (handle) => window.clearTimeout(handle),
        identity: { anonId, sessionId },
        appVersion: APP_VERSION,
      });

      const initialPath = pathnameRef.current;
      trackerRef.current = tracker;
      setActiveTracker(tracker);
      setTrackerPage(initialPath);
      tracker.track("page_view", initialPath);

      document.addEventListener("visibilitychange", flushOnExit);
      window.addEventListener("pagehide", flushOnPageHide);
    });

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", flushOnExit);
      window.removeEventListener("pagehide", flushOnPageHide);
      setActiveTracker(null);
      trackerRef.current = null;
    };
  }, []); // mount once for the segment; the path effect below handles navigations

  // On a client navigation within ZeroProof, record the new page view and keep
  // both the ref and the CTA seam pointed at the current path.
  useEffect(() => {
    pathnameRef.current = pathname;
    setTrackerPage(pathname);
    trackerRef.current?.track("page_view", pathname);
  }, [pathname]);

  return null;
}
