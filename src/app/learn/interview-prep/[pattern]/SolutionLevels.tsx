"use client";

import { useState } from "react";
import type { Approach, Solution } from "@/lib/leetcode/types";
import CodeExample from "../_shared/CodeExample";

type Level = "hidden" | "logic" | "full";

const LEVELS: { level: Level; label: string }[] = [
  { level: "hidden", label: "Hide" },
  { level: "logic", label: "Basic logic" },
  { level: "full", label: "Full solution" },
];

const levelButtonClasses =
  "rounded-md border border-border px-2.5 py-1 font-mono text-[12px] text-foreground transition-colors hover:bg-foreground/[0.06] aria-pressed:border-foreground aria-pressed:bg-foreground/[0.08] aria-pressed:font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

/**
 * One way of solving it at the chosen level: the steps and their cost, plus
 * the checked code when the level is "full".
 * @param approach - the steps, complexity, code and checks
 * @param codeTitle - the caption over the code
 * @param showCode - whether the full solution is showing
 */
function ApproachDetails({ approach, codeTitle, showCode }: { approach: Approach; codeTitle: string; showCode: boolean }) {
  return (
    <>
      <ol className="list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed text-foreground">
        {approach.approach.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="mt-2 font-mono text-[12px] text-muted">
        Time {approach.complexity.time} · Space {approach.complexity.space}
      </p>
      {showCode && (
        <CodeExample
          example={{
            title: codeTitle,
            explanation: "The checks under it run against this exact code in the test suite.",
            code: approach.code,
            cases: approach.cases,
          }}
        />
      )}
    </>
  );
}

/**
 * A problem's solution, revealed one step at a time. It starts hidden, the
 * logic comes before the code so I can try writing it from the steps, and
 * the full TypeScript only shows when I ask for it. A second way, where
 * there is one, follows the first at the same level.
 * @param title - the problem's title, used to name the control
 * @param solution - the steps, complexity, code and checks to reveal
 */
export default function SolutionLevels({ title, solution }: { title: string; solution: Solution }) {
  const [level, setLevel] = useState<Level>("hidden");

  return (
    <div className="mt-3">
      <div role="group" aria-label={`Solution for ${title}`} className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[12px] text-muted">Solution</span>
        {LEVELS.map((option) => (
          <button
            key={option.level}
            type="button"
            aria-pressed={level === option.level}
            onClick={() => setLevel(option.level)}
            className={levelButtonClasses}
          >
            {option.label}
          </button>
        ))}
      </div>
      {level !== "hidden" && (
        <div className="mt-3">
          <ApproachDetails approach={solution} codeTitle="In TypeScript" showCode={level === "full"} />
          {solution.alternative && (
            <>
              <h3 className="mt-5 mb-2 text-[14px] font-semibold text-foreground">Another way: {solution.alternative.name}</h3>
              <ApproachDetails
                approach={solution.alternative}
                codeTitle={`${solution.alternative.name} in TypeScript`}
                showCode={level === "full"}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
