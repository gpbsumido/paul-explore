"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PageShell from "@/components/PageShell";
import PageHeader from "@/components/PageHeader";
import type { IntervieweeEntry, IntervieweeTopic } from "@/lib/interviewee/types";
import { useAnswered } from "../useAnswered";
import TopicCardGrid, { type TopicCard } from "../TopicCardGrid";

/** True when focus is in a field, so the shortcuts don't fight what I'm typing. */
function isTyping(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    (el as HTMLElement).isContentEditable
  );
}

/** One question: the headline points, and the detail behind a disclosure. */
function Entry({ entry }: { entry: IntervieweeEntry }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-bold text-foreground">{entry.question}</h2>
      <ul className="mt-3 space-y-2">
        {entry.points.map((point) => (
          <li key={point} className="flex gap-2 text-[15px] text-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      {entry.details && entry.details.length > 0 ? (
        <details className="group mt-3 rounded-lg border border-border bg-surface-raised/50 p-3">
          <summary className="cursor-pointer list-none text-sm font-semibold text-primary-600 marker:content-[''] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:text-primary-400">
            <span className="group-open:hidden">Show detail</span>
            <span className="hidden group-open:inline">Hide detail</span>
          </summary>
          <div className="mt-2 space-y-2 text-sm text-muted">
            {entry.details.map((detail) => (
              <p key={detail}>{detail}</p>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}

/**
 * A single topic: the questions with their points and expandable detail, a way
 * back to the deck, and the related topics as cards. Esc (or Backspace) drops
 * back to the deck; the related cards keep their number quick-jump so I can hop
 * sideways without returning to the deck first.
 */
export default function TopicDetail({
  topic,
  related,
}: {
  topic: IntervieweeTopic;
  related: IntervieweeTopic[];
}) {
  const router = useRouter();
  const { isAnswered, toggle } = useAnswered();
  const answered = isAnswered(topic.id);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTyping()) return;
      if (event.key === "Escape" || event.key === "Backspace") {
        event.preventDefault();
        router.push("/interviewee");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  const relatedCards: TopicCard[] = related.map((sibling, index) => ({
    id: sibling.id,
    href: `/interviewee/${sibling.id}`,
    title: sibling.title,
    summary: sibling.summary,
    number: index < 9 ? index + 1 : undefined,
  }));

  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Interviewee", href: "/interviewee" },
          { label: topic.title },
        ]}
        maxWidth="max-w-3xl"
      />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/interviewee"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            <span aria-hidden="true">←</span> All topics
          </Link>
          <button
            type="button"
            onClick={() => toggle(topic.id)}
            aria-pressed={answered}
            className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            {answered ? "Answered — bring back" : "Mark answered"}
          </button>
        </div>

        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {topic.title}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            {topic.summary}
          </p>
          <p className="mt-2 text-[13px] text-muted">
            Press{" "}
            <kbd className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-foreground">
              Esc
            </kbd>{" "}
            for the deck. Numbers open a related topic below.
          </p>
        </header>

        <div className="space-y-4">
          {topic.entries.map((entry) => (
            <Entry key={entry.question} entry={entry} />
          ))}
        </div>

        {relatedCards.length > 0 ? (
          <section aria-label="Related topics" className="mt-10">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
              Related topics
            </h2>
            <TopicCardGrid cards={relatedCards} ariaLabel="Related topics" />
          </section>
        ) : null}
      </main>
    </PageShell>
  );
}
