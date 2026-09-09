import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { isAllowedEmail } from "@/lib/emailAllowlist";
import AdminEspnLeaguesContent from "./AdminEspnLeaguesContent";

export const metadata: Metadata = {
  title: "ESPN leagues · ZeroProof admin",
  description: "Register the ESPN fantasy leagues the crons ingest.",
  robots: { index: false, follow: false },
};

// Never static — the admin check reads the session, and a cached signed-in view
// served to the wrong person is exactly what this must not do.
export const dynamic = "force-dynamic";

/**
 * Admin-only. The proxy sends a signed-out visitor to login; this check is
 * "signed in, but not me" and 404s rather than 403s so the page reads as absent.
 */
export default async function EspnLeaguesAdminPage() {
  const session = await auth0.getSession();
  const isAdmin = isAllowedEmail({
    email: session?.user?.email,
    emailVerified: session?.user?.email_verified === true,
    allowlist: process.env.FLAG_ADMIN_ALLOWED_EMAILS,
  });
  if (!isAdmin) notFound();

  return <AdminEspnLeaguesContent />;
}
