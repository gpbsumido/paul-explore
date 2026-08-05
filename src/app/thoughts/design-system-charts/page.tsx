import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import DesignSystemChartsContent from "./DesignSystemChartsContent";

const TITLE = "Framework-Agnostic Charts | Thoughts";
const DESCRIPTION =
  "Rebuilding this app's recharts and unovis charts as pure SVG computed from one dependency-free geometry core, so React and Angular render identical output — Sparkline, BarChart, DonutChart, a token-driven palette, and role=img accessibility.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/design-system-charts",
});

export const revalidate = 86400;

export default function DesignSystemChartsPage() {
  return <DesignSystemChartsContent />;
}
