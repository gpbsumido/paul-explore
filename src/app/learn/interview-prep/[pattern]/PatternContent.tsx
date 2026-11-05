"use client";

import { useState } from "react";
import Link from "next/link";
import { leetCodeUrl, patternPath } from "@/lib/leetcode/urls";
import type { ReviewRating, ReviewState } from "@/lib/leetcode/review";
import type { Problem, Solution } from "@/lib/leetcode/types";
import CodeExample from "../_shared/CodeExample";
import PlaybookPage, { PHASE_TITLES } from "../_shared/PlaybookPage";
import ReviewSyncError from "../_shared/ReviewSyncError";
import { useReviewStates } from "../useReviewStates";
import SolutionLevels from "./SolutionLevels";
import type { patternPageProps } from "./patternPageProps";
import { eyebrowHeading, focusRing, linkClasses } from "../_shared/classes";

const DAY_MS = 24 * 60 * 60 * 1000;

const RATINGS: { rating: ReviewRating; label: string; hint: string }[] = [
  { rating: "again", label: "Again", hint: "couldn't solve it" },
  { rating: "hard", label: "Hard", hint: "got there slowly, or peeked" },
  { rating: "good", label: "Good", hint: "solved it cleanly" },
  { rating: "easy", label: "Easy", hint: "solved it without thinking" },
];

const buttonClasses =
  `rounded-md border border-border px-2.5 py-1 font-mono text-[12px] text-foreground transition-colors enabled:hover:bg-foreground/[0.06] disabled:cursor-wait disabled:opacity-50 ${focusRing}`;

/** Where a problem stands on the review ladder, in words. */
function describeReview(state: ReviewState | undefined, now: number): string {
  if (!state) return "Not attempted yet";
  const attempts = `${state.reviews} attempt${state.reviews === 1 ? "" : "s"}`;
  if (state.due <= now) return `Due for a re-solve · ${attempts}`;
  const days = Math.max(1, Math.round((state.due - now) / DAY_MS));
  return `Re-solve in ${days} day${days === 1 ? "" : "s"} · ${attempts}`;
}

/** One rung of the ladder: the link, the prompt, the tell behind a disclosure, the solution levels, and the rating buttons. */
function ProblemRow({
  problem,
  solution,
  state,
  now,
  canRate,
  onRate,
}: {
  problem: Problem;
  solution: Solution;
  state: ReviewState | undefined;
  now: number;
  canRate: boolean;
  onRate: (rating: ReviewRating) => void;
}) {
  return (
    <li id={problem.slug} className="scroll-mt-24 border-l-2 border-foreground/10 pl-4">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <a href={leetCodeUrl(problem.slug)} target="_blank" rel="noopener noreferrer" className={`${linkClasses} text-[15px] font-semibold`}>
          {problem.title}
          <span className="sr-only"> (opens in a new tab)</span>
          <span aria-hidden className="ml-1 text-muted">
            ↗
          </span>
        </a>
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{problem.difficulty}</span>
      </div>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{problem.prompt}</p>
      <details className="mt-2 text-[14px]">
        <summary className={`cursor-pointer rounded-sm font-mono text-[12px] text-muted hover:text-foreground ${focusRing}`}>
          The tell
        </summary>
        <p className="mt-2 leading-relaxed text-foreground">{problem.tell}</p>
      </details>
      <SolutionLevels title={problem.title} solution={solution} />
      <div role="group" aria-label={`Rate ${problem.title}`} className="mt-3 flex flex-wrap items-center gap-2">
        {RATINGS.map(({ rating, label, hint }) => (
          <button key={rating} type="button" title={hint} disabled={!canRate} onClick={() => onRate(rating)} className={buttonClasses}>
            {label}
          </button>
        ))}
        <p aria-live="polite" className="text-[12px] text-muted">
          {describeReview(state, now)}
        </p>
      </div>
    </li>
  );
}

/**
 * One pattern, laid out in the order I want to study it: the question to ask,
 * the wording that gives it away, the template (hidden until I've tried it
 * from memory), the traps, and a ladder of problems to rate as I solve them.
 * Everything comes in resolved from the server page (see patternPageProps),
 * so only this pattern and its share of the solutions reach the browser.
 */
export default function PatternContent({ pattern, previous, next, builtOn, solutions }: ReturnType<typeof patternPageProps>) {
  const { states, rate, ready, syncError } = useReviewStates("problem");
  const [now] = useState(() => Date.now());
  const [templateShown, setTemplateShown] = useState(false);

  return (
    <PlaybookPage
      breadcrumbs={[
        { label: "Learn", href: "/learn" },
        { label: "Interview prep", href: "/learn/interview-prep" },
        { label: pattern.name },
      ]}
      current="pattern"
    >
      <p className="font-mono text-[12px] text-muted">
        Phase {pattern.phase}: {PHASE_TITLES[pattern.phase]}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{pattern.name}</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-foreground">{pattern.tagline}</p>
      {builtOn.length > 0 && (
        <p className="mt-3 text-[13px] text-muted">
          Builds on{" "}
          {builtOn.map((p, i) => (
            <span key={p.id}>
              {i > 0 && ", "}
              <Link href={patternPath(p.id)} className={linkClasses}>
                {p.name}
              </Link>
            </span>
          ))}
          .
        </p>
      )}

      <div className="mt-8 border-l-2 border-foreground/25 pl-4">
        <p className={eyebrowHeading}>The question to ask</p>
        <p className="mt-2 text-[16px] font-medium leading-relaxed text-foreground">{pattern.question}</p>
      </div>
      <p className="mt-6 text-[15px] leading-relaxed text-muted">{pattern.summary}</p>
      {pattern.deepDive && (
        <p className="mt-3 text-[14px] text-muted">
          Want to watch it run first?{" "}
          <Link href={pattern.deepDive} className={linkClasses}>
            Step through the interactive walkthrough
          </Link>
          .
        </p>
      )}

      <section aria-labelledby="signals-heading" className="mt-12">
        <h2 id="signals-heading" className={eyebrowHeading}>
          Wording that gives it away
        </h2>
        <ul className="mt-4 space-y-3">
          {pattern.signals.map((signal) => (
            <li key={signal.phrase} className="text-[14px] leading-relaxed">
              <strong className="font-mono text-[13px] font-semibold text-foreground">“{signal.phrase}”</strong>
              {(signal.weight ?? 1) > 1 && <span className="ml-2 font-mono text-[11px] text-muted">strong signal</span>}
              <span className="block text-muted">{signal.why}</span>
            </li>
          ))}
        </ul>
        <h3 className="mt-8 text-[14px] font-semibold text-foreground">When it&apos;s probably not this</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed text-muted">
          {pattern.antiSignals.map((anti) => (
            <li key={anti}>{anti}</li>
          ))}
        </ul>
        <p className="mt-6 font-mono text-[13px] text-muted">
          Time {pattern.complexity.time} · Space {pattern.complexity.space}
        </p>
      </section>

      <section aria-labelledby="template-heading" className="mt-12">
        <h2 id="template-heading" className={eyebrowHeading}>
          Template
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          Write it from memory first, in an editor or on paper, then check. Recalling it is what makes it stick;
          reading it again mostly doesn&apos;t.
        </p>
        <button
          type="button"
          aria-expanded={templateShown}
          aria-controls="pattern-template"
          onClick={() => setTemplateShown(!templateShown)}
          className={`${buttonClasses} mt-4`}
        >
          {templateShown ? "Hide the template" : "Show the template"}
        </button>
        <div id="pattern-template">{templateShown && <CodeExample example={pattern.template} />}</div>
        {pattern.variants.length > 0 && (
          <>
            <h3 className="mt-10 text-[14px] font-semibold text-foreground">Variants worth knowing</h3>
            {pattern.variants.map((variant) => (
              <CodeExample key={variant.title} example={variant} />
            ))}
          </>
        )}
      </section>

      <section aria-labelledby="traps-heading" className="mt-12">
        <h2 id="traps-heading" className={eyebrowHeading}>
          Traps
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed text-muted">
          {pattern.pitfalls.map((pitfall) => (
            <li key={pitfall}>{pitfall}</li>
          ))}
        </ul>
        <h3 className="mt-8 text-[14px] font-semibold text-foreground">In JavaScript and TypeScript</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed text-muted">
          {pattern.jsNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ladder-heading" className="mt-12">
        <h2 id="ladder-heading" className={eyebrowHeading}>
          Problem ladder
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          Easy to hard. Read the prompt and name the signal before opening the tell. After each attempt, rate it:
          Again brings it back tomorrow, Hard holds the interval, Good and Easy push it further out.
        </p>
        <ReviewSyncError message={syncError} />
        <ol className="mt-6 space-y-8">
          {pattern.problems.map((problem) => (
            <ProblemRow
              key={problem.slug}
              problem={problem}
              solution={solutions[problem.slug]}
              state={states[problem.slug]}
              now={now}
              canRate={ready}
              onRate={(rating) => rate(problem.slug, rating)}
            />
          ))}
        </ol>
      </section>

      <nav aria-label="Patterns" className="mt-16 flex items-center gap-4 border-t border-foreground/5 pt-6 font-mono text-[13px]">
        {previous && (
          <Link href={patternPath(previous.id)} className={`rounded-sm text-muted hover:text-foreground ${focusRing}`}>
            <span aria-hidden>← </span>
            {previous.name}
          </Link>
        )}
        {next && (
          <Link href={patternPath(next.id)} className={`ml-auto rounded-sm text-muted hover:text-foreground ${focusRing}`}>
            {next.name}
            <span aria-hidden> →</span>
          </Link>
        )}
      </nav>
    </PlaybookPage>
  );
}
