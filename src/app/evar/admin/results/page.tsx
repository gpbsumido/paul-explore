import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { isAllowedEmail } from "@/lib/emailAllowlist";
import AdminResultsContent from "./AdminResultsContent";

export const metadata: Metadata = {
  title: "EVAR study results",
  description: "Everyone's EVAR sizing attempts, filtered by level, case, training level, timed out and date.",
  robots: { index: false, follow: false },
};

// Never static: the admin check reads the session.
export const dynamic = "force-dynamic";

/**
 * Admin-only, same gate as the admin page: the proxy handles signed-out
 * visitors and anyone else signed in gets a 404.
 */
export default async function EvarAdminResultsPage() {
  const session = await auth0.getSession();
  const isAdmin = isAllowedEmail({
    email: session?.user?.email,
    emailVerified: session?.user?.email_verified === true,
    allowlist: process.env.FLAG_ADMIN_ALLOWED_EMAILS,
  });
  if (!isAdmin) notFound();

  return <AdminResultsContent />;
}
