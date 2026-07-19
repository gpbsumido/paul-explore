"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import type { WorkFeature } from "../_data/types";
import ComingSoonDemo from "./ComingSoonDemo";
import DemoSkeleton from "./DemoSkeleton";

type DemoComponent = ComponentType<{ feature: WorkFeature }>;

/**
 * Slug to demo component. Each demo lives in its own file behind
 * next/dynamic so the page only ships the chunk for the demo on screen.
 * Demo PRs add exactly one line here each, which keeps them independent.
 */
const DEMOS: Partial<Record<string, DemoComponent>> = {
  "realtime-metrics": dynamic(() => import("./realtime-metrics"), {
    loading: () => <DemoSkeleton />,
  }),
};

/** Resolve a feature's demo, falling back to the coming-soon placeholder. */
export function demoFor(feature: WorkFeature): DemoComponent {
  return DEMOS[feature.slug] ?? ComingSoonDemo;
}
