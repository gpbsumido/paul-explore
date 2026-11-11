"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { PATTERNS, patternById } from "@/lib/leetcode/patterns";
import {
  COMPLEXITY_BUDGETS,
  complexityBudgetForInputSize,
  findSignalSpans,
  rankPatternsForText,
} from "@/lib/leetcode/signals";
import { dueItems, REVIEW_LADDER_DAYS } from "@/lib/leetcode/review";
import type { Pattern, Phase, Problem } from "@/lib/leetcode/types";
import { patternPath } from "@/lib/leetcode/urls";
import PlaybookPage, { PHASE_TITLES } from "./_shared/PlaybookPage";
import ReviewSyncError from "./_shared/ReviewSyncError";
import { useReviewStates } from "./useReviewStates";
import { eyebrowHeading, focusRing } from "./_shared/classes";

const PHASES: Phase[] = [1, 2, 3, 4];

const PROBLEM_INDEX = new Map<string, { problem: Problem; pattern: Pattern }>(
  PATTERNS.flatMap((pattern) => pattern.problems.map((problem) => [problem.slug, { problem, pattern }] as const)),
);

const EXAMPLE_STATEMENTS = [
  "Given an array of meeting time intervals, return the minimum number of conference rooms required.",
  "Return the kth largest element in an unsorted array. Can you solve it without sorting?",
  "Given an m x n grid of '1's (land) and '0's (water), return the number of islands.",
  "Given n courses and a list of prerequisite pairs, return whether you can finish all courses.",
];

const fieldClasses =
  `mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-[14px] text-foreground placeholder:text-muted ${focusRing}`;


/** The problem statement with every signal phrase that matched marked up. */
function HighlightedStatement({ text, phrases }: { text: string; phrases: string[] }) {
  const spans = findSignalSpans(text, phrases);
  const pieces = spans.reduce<{ at: number; nodes: ReactNode[] }>(
    (acc, span) => ({
      at: span.end,
      nodes: [
        ...acc.nodes,
        text.slice(acc.at, span.start),
        <mark key={span.start} className="rounded-sm bg-foreground/10 px-0.5 text-foreground underline decoration-dotted underline-offset-4">
          {text.slice(span.start, span.end)}
        </mark>,
      ],
    }),
    { at: 0, nodes: [] },
  );
  return (
    <p className="mt-4 text-[14px] leading-relaxed text-muted">
      {pieces.nodes}
      {text.slice(pieces.at)}
    </p>
  );
}

/** Paste a statement, see which patterns its wording points at, and why. */
function SignalFinder() {
  const fieldId = useId();
  const [statement, setStatement] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);
  const matches = useMemo(() => rankPatternsForText(statement).slice(0, 4), [statement]);
  const hasText = statement.trim().length > 0;

  return (
    <section aria-labelledby="signal-finder" className="mt-14">
      <h2 id="signal-finder" className={eyebrowHeading}>
        Signal finder
      </h2>
      <p className="mt-3 text-[14px] leading-relaxed text-muted">
        Paste a problem statement. The finder does what I want to do in my head on every read: spot the handful of
        phrases that give the pattern away. It&apos;s a phrase count, not magic, so treat it as a second opinion.
      </p>
      <label htmlFor={fieldId} className="mt-5 block text-[13px] font-medium text-foreground">
        Problem statement
      </label>
      <textarea
        id={fieldId}
        rows={4}
        value={statement}
        onChange={(e) => setStatement(e.target.value)}
        placeholder="Given a string s, find the length of the longest substring without repeating characters."
        className={fieldClasses}
      />
      <button
        type="button"
        onClick={() => {
          setStatement(EXAMPLE_STATEMENTS[exampleIndex]);
          setExampleIndex((exampleIndex + 1) % EXAMPLE_STATEMENTS.length);
        }}
        className={`mt-2 rounded-sm font-mono text-[12px] text-muted underline underline-offset-4 hover:text-foreground ${focusRing}`}
      >
        Try an example
      </button>

      {hasText && matches.length === 0 && (
        <p className="mt-4 text-[14px] text-muted">
          No signals yet. Look in the constraints too: the input size alone often narrows it down.
        </p>
      )}
      {matches.length > 0 && (
        <>
          <ol aria-label="Likely patterns" className="mt-5 space-y-3">
            {matches.flatMap((match) => {
              const pattern = patternById(match.patternId);
              if (!pattern) return [];
              return (
                <li key={match.patternId} className="border-l-2 border-foreground/15 pl-4">
                  <Link
                    href={patternPath(pattern.id)}
                    className={`rounded-sm text-[15px] font-semibold text-foreground underline-offset-4 hover:underline ${focusRing}`}
                  >
                    {pattern.name}
                  </Link>
                  <p className="mt-1 text-[13px] text-muted">
                    Matched: {match.matchedPhrases.map((p) => `“${p}”`).join(", ")}
                  </p>
                </li>
              );
            })}
          </ol>
          <HighlightedStatement text={statement} phrases={matches.flatMap((m) => m.matchedPhrases)} />
        </>
      )}
    </section>
  );
}

/** Turns the constraint on n into the complexity the judge will accept. */
function ComplexityBudget() {
  const fieldId = useId();
  const [rawSize, setRawSize] = useState("100000");
  const size = Number(rawSize);
  const budget = rawSize !== "" && Number.isFinite(size) && size >= 1 ? complexityBudgetForInputSize(size) : null;

  return (
    <section aria-labelledby="budget-heading" className="mt-14">
      <h2 id="budget-heading" className={eyebrowHeading}>
        Read the constraints first
      </h2>
      <p className="mt-3 text-[14px] leading-relaxed text-muted">
        A judge gets through roughly 10<sup>8</sup> simple operations in the time limit, so the largest n in the
        constraints tells you which complexities are even allowed before you&apos;ve thought about the problem.
      </p>
      <label htmlFor={fieldId} className="mt-5 block text-[13px] font-medium text-foreground">
        Largest input size (n)
      </label>
      <input
        id={fieldId}
        type="number"
        min={1}
        inputMode="numeric"
        value={rawSize}
        onChange={(e) => setRawSize(e.target.value)}
        className={`${fieldClasses} max-w-xs font-mono`}
      />
      <output aria-label="Complexity budget" className="mt-3 block text-[14px] text-foreground">
        {budget ? (
          <>
            Aim for <strong className="font-mono">{budget.budget}</strong> or better. {budget.reachFor}.
          </>
        ) : (
          "Enter the largest n from the constraints, 1 or more."
        )}
      </output>
      <table className="mt-5 w-full text-left text-[13px]">
        <caption className="sr-only">Input size to complexity</caption>
        <thead>
          <tr className="border-b border-border text-muted">
            <th scope="col" className="py-1.5 pr-4 font-medium">
              n up to
            </th>
            <th scope="col" className="py-1.5 pr-4 font-medium">
              Budget
            </th>
            <th scope="col" className="py-1.5 font-medium">
              Typical patterns
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPLEXITY_BUDGETS.map((row) => {
            const isCurrent = budget?.budget === row.budget;
            return (
              <tr
                key={row.budget}
                aria-current={isCurrent ? "true" : undefined}
                className={`border-b border-border/50 ${isCurrent ? "bg-foreground/[0.06] text-foreground" : "text-muted"}`}
              >
                <td className="py-1.5 pr-4 font-mono">
                  {Number.isFinite(row.maxInputSize) ? row.maxInputSize.toLocaleString("en-US") : "anything"}
                </td>
                <td className="py-1.5 pr-4 font-mono">
                  {row.budget}
                  {isCurrent && <span className="ml-1 font-sans text-[11px]">(yours)</span>}
                </td>
                <td className="py-1.5">{row.reachFor}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

/** Problems whose re-solve date has come round. */
function DueToday() {
  const { states, syncError } = useReviewStates("problem");
  const [now] = useState(() => Date.now());
  const due = dueItems(states, now).flatMap((slug) => {
    const entry = PROBLEM_INDEX.get(slug);
    return entry ? [entry] : [];
  });

  return (
    <section aria-labelledby="due-heading" className="mt-14">
      <h2 id="due-heading" className={eyebrowHeading}>
        Due today
      </h2>
      <ReviewSyncError message={syncError} />
      {due.length === 0 ? (
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          Nothing due. Rate a problem after you solve it and it comes back here on a {REVIEW_LADDER_DAYS.join(", ")} day ladder,
          which is how a solution goes from &quot;I&apos;ve seen this&quot; to &quot;I can write this&quot;.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {due.map(({ problem, pattern }) => (
            <li key={problem.slug} className="text-[14px]">
              <Link
                href={`${patternPath(pattern.id)}#${problem.slug}`}
                className={`rounded-sm font-medium text-foreground underline-offset-4 hover:underline ${focusRing}`}
              >
                {problem.title}
              </Link>
              <span className="text-muted"> · {pattern.name}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Every pattern in study order, grouped by phase, with how far through each ladder I am. */
function Roadmap() {
  const { states } = useReviewStates("problem");

  return (
    <section aria-labelledby="roadmap-heading" className="mt-14">
      <h2 id="roadmap-heading" className={eyebrowHeading}>
        Roadmap
      </h2>
      <p className="mt-3 text-[14px] leading-relaxed text-muted">
        {PATTERNS.length} patterns in the order they build on each other. Each page has the wording that gives it
        away, a template to write from memory, and a ladder of LeetCode problems from easy to hard.
      </p>
      {PHASES.map((phase) => (
        <div key={phase} className="mt-8">
          <h3 className="text-[15px] font-semibold text-foreground">
            Phase {phase}: {PHASE_TITLES[phase]}
          </h3>
          <ol className="mt-3 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {PATTERNS.filter((p) => p.phase === phase).map((pattern) => {
              const solved = pattern.problems.filter((p) => states[p.slug] !== undefined).length;
              return (
                <li key={pattern.id}>
                  <Link
                    href={patternPath(pattern.id)}
                    className={`rounded-sm text-[14px] font-medium text-foreground underline-offset-4 hover:underline ${focusRing}`}
                  >
                    {pattern.name}
                  </Link>
                  <p className="mt-0.5 text-[13px] leading-snug text-muted">{pattern.tagline}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted">
                    {solved} of {pattern.problems.length} solved
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </section>
  );
}

/**
 * The interview prep hub: what's due, a signal finder, the constraints table,
 * and the roadmap of every pattern.
 */
export default function LeetCodeHub() {
  const problemCount = PATTERNS.reduce((sum, p) => sum + p.problems.length, 0);
  return (
    <PlaybookPage
      breadcrumbs={[{ label: "Learn", href: "/learn" }, { label: "Interview prep" }]}
      current="roadmap"
    >
      <h1 className="reveal-up text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Interview prep</h1>
      <p className="reveal-up mt-4 max-w-xl text-[15px] leading-relaxed text-muted" style={{ animationDelay: "0.06s" }}>
        There are thousands of LeetCode problems and about two dozen ideas behind them. This is a playbook for
        learning to see which idea a problem wants from the way it&apos;s worded, then practising it until the code
        comes without thinking: {PATTERNS.length} patterns, {problemCount} hand-picked problems, a recognition drill,
        and a review schedule that brings problems back before they fade.
      </p>
      <DueToday />
      <SignalFinder />
      <ComplexityBudget />
      <Roadmap />
    </PlaybookPage>
  );
}
