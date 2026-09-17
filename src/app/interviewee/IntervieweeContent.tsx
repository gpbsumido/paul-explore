"use client";

import PageShell from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import type { IntervieweeTopic } from "@/lib/interviewee/types";
import { useAnswered } from "./useAnswered";
import TopicCardGrid, { type TopicCard } from "./TopicCardGrid";

/** The small pill that marks a topic answered or brings it back. */
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
        answered ? `Bring ${topic.title} back` : `Mark ${topic.title} answered`
      }
      className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
    >
      {answered ? "Bring back" : "Mark answered"}
    </button>
  );
}

/**
 * The deck: every topic as a card, split into what's left to review and what
 * I've already rehearsed. Answered topics drop to the bottom but stay on the
 * page, so I can reopen one or pull it back into rotation. Numbers 1-9 open the
 * cards still to review; the arrow keys walk whichever grid has focus.
 */
export default function IntervieweeContent({
  topics,
}: {
  topics: IntervieweeTopic[];
}) {
  const { isAnswered, toggle } = useAnswered();

  const review = topics.filter((topic) => !isAnswered(topic.id));
  const answered = topics.filter((topic) => isAnswered(topic.id));

  const toCard = (topic: IntervieweeTopic, number?: number): TopicCard => ({
    id: topic.id,
    href: `/interviewee/${topic.id}`,
    title: topic.title,
    summary: topic.summary,
    number,
    corner: (
      <AnsweredToggle
        topic={topic}
        answered={isAnswered(topic.id)}
        onToggle={() => toggle(topic.id)}
      />
    ),
  });

  const reviewCards = review.map((topic, index) =>
    toCard(topic, index < 9 ? index + 1 : undefined),
  );
  const answeredCards = answered.map((topic) => toCard(topic));

  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Interviewee" }]}
        maxWidth="max-w-3xl"
      />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <header className="mb-8">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
            Prep deck
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Interviewee
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Topics I open mid-interview. Pick a card for the bullet-point answers
            and the detail behind them.
          </p>
          <p className="mt-2 text-[13px] text-muted">
            Press{" "}
            <kbd className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-foreground">
              1
            </kbd>
            –
            <kbd className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-foreground">
              9
            </kbd>{" "}
            to open a topic, or tab in and use the arrow keys.
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
              All caught up. Everything&rsquo;s marked answered &mdash; bring one
              back below to review it again.
            </p>
          )}
        </section>

        {answeredCards.length > 0 ? (
          <section aria-label="Answered">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
              Answered
            </h2>
            <TopicCardGrid cards={answeredCards} ariaLabel="Answered topics" />
          </section>
        ) : null}
      </main>
    </PageShell>
  );
}
