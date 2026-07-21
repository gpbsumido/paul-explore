"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import { FEATURES } from "../_data/catalog";
import type { WorkFeature } from "../_data/types";
import ComingSoonDemo from "./ComingSoonDemo";
import DemoSkeleton from "./DemoSkeleton";

export type DemoComponent = ComponentType<{ feature: WorkFeature }>;

/**
 * Real demos, one line per shipped demo. Each lives in its own file behind
 * next/dynamic so the page only ships the chunk for the demo on screen.
 * Demo PRs add exactly one line here each, which keeps them independent.
 */
const SHIPPED: Partial<Record<string, DemoComponent>> = {
  "realtime-metrics": dynamic(() => import("./realtime-metrics"), {
    loading: () => <DemoSkeleton />,
  }),
  "chart-library": dynamic(() => import("./chart-library"), {
    loading: () => <DemoSkeleton />,
  }),
  "standard-analytics": dynamic(() => import("./standard-analytics"), {
    loading: () => <DemoSkeleton />,
  }),
  "per-game-analytics": dynamic(() => import("./per-game-analytics"), {
    loading: () => <DemoSkeleton />,
  }),
  "slug-dashboards": dynamic(() => import("./slug-dashboards"), {
    loading: () => <DemoSkeleton />,
  }),
  "dashboard-designer": dynamic(() => import("./dashboard-designer"), {
    loading: () => <DemoSkeleton />,
  }),
  "wallet-lookup": dynamic(() => import("./wallet-lookup"), {
    loading: () => <DemoSkeleton />,
  }),
  "llm-assistant": dynamic(() => import("./llm-assistant"), {
    loading: () => <DemoSkeleton />,
  }),
  "email-campaigns": dynamic(() => import("./email-campaigns"), {
    loading: () => <DemoSkeleton />,
  }),
  "workflow-editor": dynamic(() => import("./workflow-editor"), {
    loading: () => <DemoSkeleton />,
  }),
  "signup-flow": dynamic(() => import("./signup-flow"), {
    loading: () => <DemoSkeleton />,
  }),
  "admin-suite": dynamic(() => import("./admin-suite"), {
    loading: () => <DemoSkeleton />,
  }),
  "ai-content-engine": dynamic(() => import("./ai-content-engine"), {
    loading: () => <DemoSkeleton />,
  }),
  "ua-campaign-builder": dynamic(() => import("./ua-campaign-builder"), {
    loading: () => <DemoSkeleton />,
  }),
  "referral-links": dynamic(() => import("./referral-links"), {
    loading: () => <DemoSkeleton />,
  }),
  "auth-flows": dynamic(() => import("./auth-flows"), {
    loading: () => <DemoSkeleton />,
  }),
  "campaign-manager": dynamic(() => import("./campaign-manager"), {
    loading: () => <DemoSkeleton />,
  }),
  "post-queue": dynamic(() => import("./post-queue"), {
    loading: () => <DemoSkeleton />,
  }),
  "community-mode": dynamic(() => import("./community-mode"), {
    loading: () => <DemoSkeleton />,
  }),
  "character-sheets": dynamic(() => import("./character-sheets"), {
    loading: () => <DemoSkeleton />,
  }),
  "game-demo": dynamic(() => import("./game-demo"), {
    loading: () => <DemoSkeleton />,
  }),
  "nft-inventory": dynamic(() => import("./nft-inventory"), {
    loading: () => <DemoSkeleton />,
  }),
};

/**
 * Every slug resolved up front, coming-soon placeholder where no demo has
 * shipped yet. Built at module scope so render code does a plain lookup.
 */
export const DEMO_BY_SLUG: Record<string, DemoComponent> = Object.fromEntries(
  FEATURES.map((f) => [f.slug, SHIPPED[f.slug] ?? ComingSoonDemo]),
);
