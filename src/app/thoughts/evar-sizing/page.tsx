import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import EvarSizingContent from "./EvarSizingContent";

const TITLE = "Practising EVAR Sizing on a CT Phantom | Thoughts";
const DESCRIPTION =
  "A practice page for the measurements that decide an endovascular aneurysm repair. Why the scans are a phantom drawn from a dozen numbers rather than real CT, how a slice became a function, and the keyboard caliper.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/evar-sizing",
});

export const revalidate = 86400;

export default function EvarSizingThoughtsPage() {
  return <EvarSizingContent />;
}
