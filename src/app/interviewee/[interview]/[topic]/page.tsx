import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { isAllowedEmail } from "@/lib/emailAllowlist";
import {
  interviewById,
  topicInInterview,
  relatedTopicsInInterview,
} from "@/lib/interviewee/interviews.data";
import TopicDetail from "./TopicDetail";

export const metadata: Metadata = {
  title: "Interviewee",
  robots: { index: false, follow: false },
};

/** Session-reading, so never statically rendered (see the dynamicRendering guard). */
export const dynamic = "force-dynamic";

export default async function IntervieweeTopicPage({
  params,
}: {
  params: Promise<{ interview: string; topic: string }>;
}) {
  const session = await auth0.getSession();
  const isAdmin = isAllowedEmail({
    email: session?.user?.email,
    emailVerified: session?.user?.email_verified === true,
    allowlist: process.env.FLAG_ADMIN_ALLOWED_EMAILS,
  });
  if (!isAdmin) notFound();

  const { interview: interviewId, topic: topicId } = await params;
  const interview = interviewById(interviewId);
  const topic = interview ? topicInInterview(interview, topicId) : undefined;
  if (!interview || !topic) notFound();

  return (
    <TopicDetail
      interviewId={interview.id}
      topic={topic}
      related={relatedTopicsInInterview(interview, topic)}
    />
  );
}
