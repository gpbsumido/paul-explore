"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { PATTERNS, patternById } from "@/lib/leetcode/patterns";
import { leetCodeUrl, patternPath } from "@/lib/leetcode/urls";
import { buildDrillOptions, drillDeck, isAcceptedAnswer, nextDrillCard, type DrillCard } from "@/lib/leetcode/drill";
import type { Pattern } from "@/lib/leetcode/types";
import PlaybookPage from "../_shared/PlaybookPage";
import ReviewSyncError from "../_shared/ReviewSyncError";
import { useReviewStates } from "../useReviewStates";
import { eyebrowHeading, focusRing, linkClasses } from "../_shared/classes";

const DECK = drillDeck(PATTERNS);


/**
 * A repeatable source of numbers in [0, 1) from a string (mulberry32 over an
 * FNV-1a hash). Seeding the shuffle by card keeps render pure and the server
 * and client markup identical, while a card's options still change from one
 * review to the next.
 */
function seededRandom(seed: string): () => number {
  let state = [...seed].reduce((hash, ch) => Math.imul(hash ^ ch.charCodeAt(0), 16777619), 2166136261);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Answered = { card: DrillCard; options: Pattern[]; chosen: string };

/**
 * The recognition drill: a problem statement, four patterns, pick one. It
 * trains the step interviews actually test, which is deciding what to reach
 * for, and it runs on the same review ladder as the problems so cards I miss
 * come back tomorrow and cards I know drift out to months.
 */
export default function DrillContent() {
  const scopeId = useId();
  const { states, rate, ready, syncError } = useReviewStates("drill");
  const [now, setNow] = useState(() => Date.now());
  const [scope, setScope] = useState("all");
  const [studyAhead, setStudyAhead] = useState(false);
  const [answered, setAnswered] = useState<Answered | null>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const questionHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (answered) nextButton.current?.focus();
  }, [answered]);

  const inScope = scope === "all" ? DECK : DECK.filter((c) => c.patternId === scope);
  const dueCount = inScope.filter((c) => (states[c.problem.slug]?.due ?? Number.POSITIVE_INFINITY) <= now).length;
  const newCount = inScope.filter((c) => states[c.problem.slug] === undefined).length;

  const card = answered?.card ?? nextDrillCard({ deck: inScope, states, now, studyAhead });
  const options =
    answered?.options ??
    (card
      ? buildDrillOptions({
          card,
          patterns: PATTERNS,
          random: seededRandom(`${card.problem.slug}:${states[card.problem.slug]?.reviews ?? 0}`),
        })
      : []);
  const answerPattern = card ? patternById(card.patternId) : undefined;

  function choose(patternId: string) {
    if (!card) return;
    rate(card.problem.slug, isAcceptedAnswer(card, patternId) ? "good" : "again");
    setAnswered({ card, options, chosen: patternId });
  }

  function nextCard() {
    setAnswered(null);
    setNow(Date.now());
    questionHeading.current?.focus();
  }

  const wasRight = answered ? isAcceptedAnswer(answered.card, answered.chosen) : false;

  return (
    <PlaybookPage
      breadcrumbs={[
        { label: "Learn", href: "/learn" },
        { label: "Interview prep", href: "/learn/interview-prep" },
        { label: "Drill" },
      ]}
      current="drill"
    >
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Recognition drill</h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
        Read the statement and name the pattern before you think about code. Spotting it is most of the battle, and
        it&apos;s the part that goes when you only ever practise one topic at a time. Misses come back tomorrow; hits
        drift further out each time.
      </p>

      <div className="mt-8 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <label htmlFor={scopeId} className="block text-[13px] font-medium text-foreground">
            Drill on
          </label>
          <select
            id={scopeId}
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              setAnswered(null);
            }}
            className={`mt-2 rounded-md border border-border bg-surface px-3 py-2 text-[14px] text-foreground ${focusRing}`}
          >
            <option value="all">Every pattern, mixed</option>
            {PATTERNS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <p className="font-mono text-[12px] text-muted">
          {dueCount} due · {newCount} new · {inScope.length} cards
        </p>
      </div>
      <ReviewSyncError message={syncError} />

      {card && answerPattern ? (
        <section aria-labelledby="drill-question" className="mt-10 border-l-2 border-foreground/15 pl-5">
          <p className={eyebrowHeading}>The problem</p>
          <p className="mt-3 text-[16px] leading-relaxed text-foreground">{card.problem.prompt}</p>

          <h2 id="drill-question" ref={questionHeading} tabIndex={-1} className="mt-8 text-[15px] font-semibold text-foreground focus:outline-none">
            Which pattern does this problem want?
          </h2>
          <div role="group" aria-labelledby="drill-question" className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {options.map((option) => {
              const isAnswer = answered !== null && option.id === answered.card.patternId;
              const isChosen = answered?.chosen === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={answered !== null || !ready}
                  onClick={() => choose(option.id)}
                  className={`rounded-md border px-3 py-2.5 text-left text-[14px] text-foreground transition-colors enabled:hover:bg-foreground/[0.06] disabled:cursor-default ${focusRing} ${
                    isAnswer ? "border-foreground font-semibold" : isChosen ? "border-foreground/40 line-through" : "border-border"
                  }`}
                >
                  {option.name}
                </button>
              );
            })}
          </div>

          <div role="status" className="mt-5 text-[15px] font-medium text-foreground">
            {answered && (wasRight ? `Correct: ${answerPattern.name}.` : `Not quite. This one is ${answerPattern.name}.`)}
          </div>

          {answered && (
            <div className="mt-3">
              <p className="text-[14px] leading-relaxed text-muted">{card.problem.tell}</p>
              <p className="mt-3 text-[13px] text-muted">
                <a href={leetCodeUrl(card.problem.slug)} target="_blank" rel="noopener noreferrer" className={linkClasses}>
                  {card.problem.title}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>{" "}
                ·{" "}
                <Link href={patternPath(answerPattern.id)} className={linkClasses}>
                  Review {answerPattern.name}
                </Link>
              </p>
              <button
                ref={nextButton}
                type="button"
                onClick={nextCard}
                className={`mt-6 rounded-md border border-foreground px-4 py-2 font-mono text-[13px] text-foreground hover:bg-foreground/[0.06] ${focusRing}`}
              >
                Next card
              </button>
            </div>
          )}
        </section>
      ) : (
        <section aria-labelledby="drill-done" className="mt-10">
          <h2 id="drill-done" className="text-[15px] font-semibold text-foreground">
            Nothing due right now
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Every card in this set has been seen and none is due yet. Spacing is the point, so coming back tomorrow
            does more than grinding now. If you want more anyway:
          </p>
          <button
            type="button"
            onClick={() => setStudyAhead(true)}
            className={`mt-4 rounded-md border border-border px-4 py-2 font-mono text-[13px] text-foreground hover:bg-foreground/[0.06] ${focusRing}`}
          >
            Study ahead
          </button>
        </section>
      )}
    </PlaybookPage>
  );
}
