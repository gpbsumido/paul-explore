import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import MicroFrontendsContent from "./MicroFrontendsContent";

const TITLE = "Splitting out a micro-frontend | Thoughts";
const DESCRIPTION =
  "Moving the work portfolio into its own repo and loading it at runtime over Module Federation: a contract package, a host that owns the URL and the data, a canary React, a CSS collision only a real mount could find, and a strangler flag that fails closed.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/micro-frontends",
});

export const revalidate = 86400;

export default function MicroFrontendsPage() {
  return <MicroFrontendsContent />;
}
