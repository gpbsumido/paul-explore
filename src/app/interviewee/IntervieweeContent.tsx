"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import type { Interview } from "@/lib/interviewee/types";
import { searchInterviewTopics } from "@/lib/interviewee/search";
import { useAnswered } from "./useAnswered";
import { answeredKey } from "./answeredKey";
import TopicCardGrid, { type TopicCard } from "./TopicCardGrid";

/**
 * The deck's front page: the job interviews, with a search box over everything
 * inside them. Empty box shows the interviews; a query filters to the matching
 * topics across every interview — matched against titles, summaries, and all
 * the text inside (questions, points, and the expandable detail). Each card
 * shows how many of an interview's topics I've marked reviewed. Numbers 1-9
 * open the cards on screen; the arrow keys walk the grid; both stand down while
 * I'm typing in the search box.
 */
export default function IntervieweeContent({
  interviews,
}: {
  interviews: Interview[];
}) {
  const router = useRouter();
  const { isAnswered } = useAnswered();
  const [query, setQuery] = useState("");
  const trimmed = query.trim();

  const hits = useMemo(
    () => searchInterviewTopics(interviews, query),
    [interviews, query],
  );

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

  const resultCards: TopicCard[] = hits.map((hit, index) => ({
    id: `${hit.interviewId}/${hit.topic.id}`,
    href: `/interviewee/${hit.interviewId}/${hit.topic.id}`,
    title: hit.topic.title,
    summary: `${hit.interviewTitle} · ${hit.topic.summary}`,
    number: index < 9 ? index + 1 : undefined,
  }));

  // Enter in the box opens the top result, so a search is a two-keystroke jump.
  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && hits.length > 0) {
      event.preventDefault();
      router.push(resultCards[0].href);
    }
  };

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
            topics, or search across every interview to jump straight to a topic.
          </p>
        </header>

        <div className="mb-8">
          <label htmlFor="interviewee-search" className="sr-only">
            Search topics
          </label>
          <input
            id="interviewee-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Search topics — titles and everything inside…"
            autoComplete="off"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          />
          {trimmed === "" ? (
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
          ) : null}
        </div>

        {trimmed === "" ? (
          <section aria-label="Interviews">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
              Interviews
            </h2>
            <TopicCardGrid cards={interviewCards} ariaLabel="Job interviews" />
          </section>
        ) : (
          <section aria-label="Search results">
            <p role="status" className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
              {hits.length} {hits.length === 1 ? "result" : "results"} for &ldquo;
              {trimmed}&rdquo;
            </p>
            {hits.length > 0 ? (
              <TopicCardGrid cards={resultCards} ariaLabel="Matching topics" />
            ) : (
              <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
                No topics match &ldquo;{trimmed}&rdquo;. Try a shorter or
                different word.
              </p>
            )}
          </section>
        )}
      </main>
    </PageShell>
  );
}
