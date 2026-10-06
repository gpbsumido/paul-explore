import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import OrganizationsContent from "./OrganizationsContent";

const TITLE = "Organizations";
const DESCRIPTION =
  "A B2B tenancy lab: route an email to its organization's connection, mint an org-scoped session, and watch tenant isolation decide every request.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/learn/organizations",
  ogType: "website",
});

export default function OrganizationsPage() {
  return <OrganizationsContent />;
}
