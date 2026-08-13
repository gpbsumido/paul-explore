import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import SecurityAuditContent from "./SecurityAuditContent";

const TITLE = "Auditing for Absences | Thoughts";
const DESCRIPTION =
  "AI-written code passes security tests 56% of the time, and worst of all on the vulnerabilities that come from what is missing. A security audit of this codebase, and the seven shapes of absence it actually found.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/security-audit",
});

export const revalidate = 86400;

export default function SecurityAuditPage() {
  return <SecurityAuditContent />;
}
