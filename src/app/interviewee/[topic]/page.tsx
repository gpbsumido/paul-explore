import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  TOPICS,
  topicById,
  relatedTopics,
} from "@/lib/interviewee/topics.data";
import TopicDetail from "./TopicDetail";

/** Every topic is known at build time, so pre-render the lot. */
export function generateStaticParams(): { topic: string }[] {
  return TOPICS.map((topic) => ({ topic: topic.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic: id } = await params;
  const topic = topicById(id);
  if (!topic) return { title: "Interviewee" };
  return {
    title: `${topic.title} | Interviewee`,
    description: topic.summary,
    robots: { index: false, follow: false },
  };
}

export default async function IntervieweeTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic: id } = await params;
  const topic = topicById(id);
  if (!topic) notFound();

  return <TopicDetail topic={topic} related={relatedTopics(topic)} />;
}
