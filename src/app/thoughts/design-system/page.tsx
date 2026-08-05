import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import DesignSystemContent from "./DesignSystemContent";

const TITLE = "Shared Design System | Thoughts";
const DESCRIPTION =
  "Extracting a shared design system from one app and wiring it into two — CSS custom properties as the canonical token format, thin framework wrappers, the publish-to-npm workflow, and the charts that exposed a package shipping components no consumer could bind to.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/design-system",
});

export const revalidate = 86400;

export default function DesignSystemPage() {
  return <DesignSystemContent />;
}
