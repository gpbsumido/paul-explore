import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { isAllowedEmail } from "@/lib/emailAllowlist";
import AdminBetsContent from "./AdminBetsContent";

export const metadata: Metadata = {
  title: "Bets · ZeroProof admin",
  description: "See and search every player's ZeroProof bets and records.",
  robots: { index: false, follow: false },
};

// Never static — the admin check reads the session, and a cached signed-in view
// served to the wrong person is exactly what this must not do.
export const dynamic = "force-dynamic";

/**
 * Admin-only god's view. The proxy sends a signed-out visitor to login; this
 * check is "signed in, but not me" and 404s rather than 403s so the page reads
 * as absent, matching the other ZeroProof admin surfaces.
 */
export default async function AdminBetsPage() {
  const session = await auth0.getSession();
  const isAdmin = isAllowedEmail({
    email: session?.user?.email,
    emailVerified: session?.user?.email_verified === true,
    allowlist: process.env.FLAG_ADMIN_ALLOWED_EMAILS,
  });
  if (!isAdmin) notFound();

  return <AdminBetsContent />;
}
