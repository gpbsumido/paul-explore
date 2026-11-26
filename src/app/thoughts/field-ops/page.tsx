import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import FieldOpsContent from "./FieldOpsContent";

const TITLE = "A Field Console That Tells the Truth | Thoughts";
const DESCRIPTION =
  "A simulated field console with live tracks, video and alerts on a 3D map. Real streaming endpoints, fake data, and the decisions that keep it honest when data goes stale or the link drops.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/field-ops",
});

export const revalidate = 86400;

export default function FieldOpsThoughtsPage() {
  return <FieldOpsContent />;
}
