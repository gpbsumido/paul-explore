"use client";

import PageShell from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import type { Interview } from "@/lib/interviewee/types";
import { useAnswered } from "./useAnswered";
import { answeredKey } from "./answeredKey";
import TopicCardGrid, { type TopicCard } from "./TopicCardGrid";

/**
 * The deck's front page: the job interviews. Pick one to see its topics. Each
 * card shows how many of its topics I've marked reviewed, so the interview I'm
 * mid-way through is legible at a glance. Numbers 1-9 open an interview; the
 * arrow keys walk the grid.
 */
export default function IntervieweeContent({
  interviews,
}: {
  interviews: Interview[];
}) {
  const { isAnswered } = useAnswered();

  const cards: TopicCard[] = interviews.map((interview, index) => {
    const total = interview.topics.length;
    const reviewed = interview.topics.filter((topic) =>
      isAnswered(answeredKey(interview.id, topic.id)),
    ).length;
    return {
      id: interview.id,
      href: `/interviewee/${interview.id}`,
      title: interview.title,
      summary: interview.summary,
      number: index < 9 ? index + 1 : undefined,
      corner: (
        <span className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-semibold tabular-nums text-muted">
          {reviewed}/{total} reviewed
        </span>
      ),
    };
  });

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
            My interview prep, organised by job interview. Open one for its
            topics, then a topic for the bullet-point answers and the detail
            behind them.
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
            to open an interview, or tab in and use the arrow keys.
          </p>
        </header>

        <section aria-label="Interviews">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
            Interviews
          </h2>
          <TopicCardGrid cards={cards} ariaLabel="Job interviews" />
        </section>
      </main>
    </PageShell>
  );
}
