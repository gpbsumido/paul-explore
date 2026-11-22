import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { isSiteAdmin } from "@/lib/emailAllowlist";
import AdminIngestHealthContent from "./AdminIngestHealthContent";

export const metadata: Metadata = {
  title: "Ingest health · ZeroProof admin",
  description: "Which sports and ESPN leagues are resolving on the sync and settle crons.",
  robots: { index: false, follow: false },
};

// Never static — the admin check reads the session, and a cached signed-in view
// served to the wrong person is exactly what this must not do.
export const dynamic = "force-dynamic";

/**
 * Admin-only. The proxy sends a signed-out visitor to login; this check is
 * "signed in, but not me" and 404s rather than 403s so the page reads as absent.
 */
export default async function IngestHealthAdminPage() {
  const session = await auth0.getSession();
  const isAdmin = isSiteAdmin(session);
  if (!isAdmin) notFound();

  return <AdminIngestHealthContent />;
}
