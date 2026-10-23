import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { isAllowedEmail } from "@/lib/emailAllowlist";
import AdminReferencesContent from "./AdminReferencesContent";

export const metadata: Metadata = {
  title: "References · EVAR Sizing admin",
  description: "Set the reference answers each EVAR practice case is scored against.",
  robots: { index: false, follow: false },
};

// Never static: the admin check reads the session.
export const dynamic = "force-dynamic";

/**
 * Admin-only. The proxy sends a signed-out visitor to login; this check is
 * "signed in, but not me" and 404s so the page reads as absent.
 */
export default async function EvarReferencesAdminPage() {
  const session = await auth0.getSession();
  const isAdmin = isAllowedEmail({
    email: session?.user?.email,
    emailVerified: session?.user?.email_verified === true,
    allowlist: process.env.FLAG_ADMIN_ALLOWED_EMAILS,
  });
  if (!isAdmin) notFound();

  return <AdminReferencesContent />;
}
