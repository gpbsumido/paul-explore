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
  "dashboard-designer": dynamic(() => import("./dashboard-designer"), {
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
