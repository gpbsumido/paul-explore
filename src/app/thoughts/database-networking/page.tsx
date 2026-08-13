import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import DatabaseNetworkingContent from "./DatabaseNetworkingContent";

const TITLE = "Taking the Database Off the Public Internet | Thoughts";
const DESCRIPTION =
  "A front-end engineer working through the backend half: a Postgres reachable from anywhere, a TLS rabbit hole worth abandoning, migrations nothing ran, and four minutes of downtime from a password rotation whose failure arrives late.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/database-networking",
});

export const revalidate = 86400;

export default function DatabaseNetworkingPage() {
  return <DatabaseNetworkingContent />;
}
