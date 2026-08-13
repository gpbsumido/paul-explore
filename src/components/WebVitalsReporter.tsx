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
 * The five metrics split into two groups, and they need different answers to
 * "which page was this?".
 *
 * FCP, LCP and TTFB describe the initial document load, so they belong to
 * whatever page was loading when the observers were registered. That matters
 * most for LCP: web-vitals only flushes it on first interaction, and on this
 * site the first interaction is usually a click on a nav link. Reading the
 * pathname at that point credits the load to the page the user just navigated
 * to, which is how a static prose page ended up reporting a 22 second LCP.
 *
 * INP and CLS are genuinely scoped to the view the user is on now, so those
 * keep reading the ref and follow client-side navigations.
 */
export default function WebVitalsReporter() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  // keep the ref current as the user navigates — no observer re-registration needed
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return;

    // captured once, at registration — the page this document load is for
    const loadPage = pathnameRef.current;

    const reportLoad = (metric: MetricType) => sendVital(metric, loadPage);
    const reportInteraction = (metric: MetricType) =>
      sendVital(metric, pathnameRef.current);

    onFCP(reportLoad);
    onLCP(reportLoad);
    onTTFB(reportLoad);

    onCLS(reportInteraction);
    onINP(reportInteraction);
  }, []); // register once per mount — the ref handles pathname updates

  return null;
}
