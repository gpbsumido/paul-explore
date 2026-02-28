"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { version } from "../../package.json";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import type { MetricType } from "web-vitals";

// what gets sent to /api/vitals on each metric report
type VitalPayload = {
  metric: string;
  value: number;
  rating: string;
  page: string;
  nav_type: string;
  app_version: string;
};

/**
 * Sends a single metric beacon to /api/vitals.
 *
 * sendBeacon is the right tool here because it's guaranteed to fire even when
 * the user closes the tab mid-navigation. A regular fetch can get killed
 * before the browser sends it; sendBeacon queues the request at the OS level
 * so the data makes it through. The Blob wrapper forces the content-type to
 * application/json instead of the browser's default text/plain.
 */
function sendVital(metric: MetricType, page: string) {
  const payload: VitalPayload = {
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    page,
    nav_type: metric.navigationType,
    app_version: version,
  };

  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/vitals",
      new Blob([body], { type: "application/json" }),
    );
  } else {
    // keepalive lets the request outlive the page in browsers without sendBeacon
    fetch("/api/vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  }
}

/**
 * Registers all five Core Web Vital collectors once on mount and reports each
 * one to /api/vitals when it fires. Lives in the root layout so every page
 * is covered without any per-page setup.
 *
 * The pathname ref keeps the reported page accurate across SPA navigations
 * without re-registering the observers on every route change. Observers are
 * registered once; when LCP/CLS/INP/etc. eventually fire, they read the ref
 * to get whatever pathname is current at that moment.
 */
export default function WebVitalsReporter() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  // keep the ref current as the user navigates — no observer re-registration needed
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const report = (metric: MetricType) =>
      sendVital(metric, pathnameRef.current);

    onCLS(report);
    onFCP(report);
    onINP(report);
    onLCP(report);
    onTTFB(report);
  }, []); // register once per mount — the ref handles pathname updates

  return null;
}
