import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import OrganizationsContent from "./OrganizationsContent";

const TITLE = "Organizations | Thoughts";
const DESCRIPTION =
  "A lab for B2B tenancy: routing an email to its customer's connection, minting an org-scoped session, and making tenant isolation the first check on every request.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/organizations",
});

export const revalidate = 86400;

export default function OrganizationsPage() {
  return <OrganizationsContent />;
}
