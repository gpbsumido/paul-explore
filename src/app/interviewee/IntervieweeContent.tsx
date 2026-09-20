"use client";

import PageShell from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import PageIntro from "@/components/PageIntro";
import type { Interview } from "@/lib/interviewee/types";
import { useAnswered } from "./useAnswered";
import { answeredKey } from "./answeredKey";
import TopicCardGrid, { type TopicCard } from "./TopicCardGrid";
import TopicSearchBox from "./TopicSearchBox";
import ReviewSync from "./ReviewSync";

/**
 * The deck's front page: a search combobox over everything, the job interviews
 * as cards (each showing how many of its topics I've marked reviewed), and a
 * panel to move review progress between devices. Numbers 1-9 open the cards on
 * screen and the arrow keys walk the grid; both stand down while I'm typing in
 * the search box.
 */
export default function IntervieweeContent({
  interviews,
}: {
  interviews: Interview[];
}) {
  const { isAnswered } = useAnswered();

  const interviewCards: TopicCard[] = interviews.map((interview, index) => {
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
        <PageIntro
          eyebrow="Prep deck"
          title="Interviewee"
          lede="My interview prep, organised by job interview. Open one for its topics, or search across every interview to jump straight to a topic."
        />

        <div className="mb-8">
          <TopicSearchBox interviews={interviews} />
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
        </div>

        <section aria-label="Interviews">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
            Interviews
          </h2>
          <TopicCardGrid cards={interviewCards} ariaLabel="Job interviews" />
        </section>

        <ReviewSync />
      </main>
    </PageShell>
  );
}
