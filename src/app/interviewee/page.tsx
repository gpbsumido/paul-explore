import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { isAllowedEmail } from "@/lib/emailAllowlist";
import { INTERVIEWS } from "@/lib/interviewee/interviews.data";
import IntervieweeContent from "./IntervieweeContent";

/**
 * My interview prep, so kept out of search engines and behind sign-in: the
 * content is mine to rehearse, not to publish.
 */
export const metadata: Metadata = {
  title: "Interviewee",
  description: "Interview prep, organised by job interview.",
  robots: { index: false, follow: false },
};

/**
 * Session-reading, so never statically rendered — stated rather than inferred,
 * the same way /to-do is (see the dynamicRendering guard).
 */
export const dynamic = "force-dynamic";

/**
 * Admin-only. The proxy already sends a signed-out visitor to login (see
 * protectedPaths), so this check is specifically "signed in, but not me". 404
 * rather than 403, so the page's existence isn't confirmed to anyone else.
 */
export default async function IntervieweePage() {
  const session = await auth0.getSession();
  const isAdmin = isAllowedEmail({
    email: session?.user?.email,
    emailVerified: session?.user?.email_verified === true,
    allowlist: process.env.FLAG_ADMIN_ALLOWED_EMAILS,
  });
  if (!isAdmin) notFound();

  return <IntervieweeContent interviews={INTERVIEWS} />;
}
