import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { isAllowedEmail } from "@/lib/emailAllowlist";
import { interviewById } from "@/lib/interviewee/interviews.data";
import InterviewContent from "./InterviewContent";

export const metadata: Metadata = {
  title: "Interviewee",
  robots: { index: false, follow: false },
};

/**
 * Session-reading, so never statically rendered — stated rather than inferred,
 * the same way /to-do is (see the dynamicRendering guard).
 */
export const dynamic = "force-dynamic";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ interview: string }>;
}) {
  const session = await auth0.getSession();
  const isAdmin = isAllowedEmail({
    email: session?.user?.email,
    emailVerified: session?.user?.email_verified === true,
    allowlist: process.env.FLAG_ADMIN_ALLOWED_EMAILS,
  });
  if (!isAdmin) notFound();

  const { interview: id } = await params;
  const interview = interviewById(id);
  if (!interview) notFound();

  return <InterviewContent interview={interview} />;
}
