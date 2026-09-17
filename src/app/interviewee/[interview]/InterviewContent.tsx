"use client";

import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import type { Interview, IntervieweeTopic } from "@/lib/interviewee/types";
import { useAnswered } from "../useAnswered";
import { answeredKey } from "../answeredKey";
import TopicCardGrid, { type TopicCard } from "../TopicCardGrid";

/** The small pill that marks a topic reviewed or brings it back. */
function AnsweredToggle({
  topic,
  answered,
  onToggle,
}: {
  topic: IntervieweeTopic;
  answered: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={
        answered ? `Bring ${topic.title} back` : `Mark ${topic.title} reviewed`
      }
      className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
    >
      {answered ? "Bring back" : "Mark reviewed"}
    </button>
  );
}

/**
 * One interview's topics, split into what's left to review and what I've
 * rehearsed. Reviewed topics drop to the bottom but stay openable and
 * reversible. Numbers 1-9 open the topics still to review; the arrow keys walk
 * whichever grid has focus.
 */
export default function InterviewContent({
  interview,
}: {
  interview: Interview;
}) {
  const { isAnswered, toggle } = useAnswered();
  const key = (topic: IntervieweeTopic) => answeredKey(interview.id, topic.id);

  const review = interview.topics.filter((topic) => !isAnswered(key(topic)));
  const reviewed = interview.topics.filter((topic) => isAnswered(key(topic)));

  const toCard = (topic: IntervieweeTopic, number?: number): TopicCard => ({
    id: topic.id,
    href: `/interviewee/${interview.id}/${topic.id}`,
    title: topic.title,
    summary: topic.summary,
    number,
    corner: (
      <AnsweredToggle
        topic={topic}
        answered={isAnswered(key(topic))}
        onToggle={() => toggle(key(topic))}
      />
    ),
  });

  const reviewCards = review.map((topic, index) =>
    toCard(topic, index < 9 ? index + 1 : undefined),
  );
  const reviewedCards = reviewed.map((topic) => toCard(topic));

  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Interviewee", href: "/interviewee" },
          { label: interview.title },
        ]}
        maxWidth="max-w-3xl"
      />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="mb-6">
          <Link
            href="/interviewee"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            <span aria-hidden="true">←</span> All interviews
          </Link>
        </div>

        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {interview.title}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            {interview.summary}
          </p>
        </header>

        <section aria-label="To review" className="mb-10">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
            To review
          </h2>
          {reviewCards.length > 0 ? (
            <TopicCardGrid cards={reviewCards} ariaLabel="Topics to review" />
          ) : (
            <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
              All caught up. Every topic here is marked reviewed &mdash; bring one
              back below to go over it again.
            </p>
          )}
        </section>

        {reviewedCards.length > 0 ? (
          <section aria-label="Reviewed">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
              Reviewed
            </h2>
            <TopicCardGrid cards={reviewedCards} ariaLabel="Reviewed topics" />
          </section>
        ) : null}
      </main>
    </PageShell>
  );
}
