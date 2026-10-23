"use client";

import Link from "next/link";
import Modal from "@/components/ui/Modal";
import type { DeviceGrade, LengthGrade, Reach } from "@/lib/evar/endurant";
import type { Outcome } from "@/lib/evar/game";
import type { EvarCase } from "@/lib/evar/phantom";
import type { ReferenceRow } from "@/lib/evar/references";
import type { TaskScore } from "@/lib/evar/measure";
import { clock, mm } from "./format";

const button =
  "paul-touch-min rounded-lg border border-border bg-surface px-4 py-2 text-[14px] text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";

const STAR =
  "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";

/**
 * Three stars, filled up to the count. Decorative, since the count is also
 * written out, and they rise in one after another unless motion is reduced.
 */
function StarRow({ stars }: { stars: number }) {
  return (
    <span aria-hidden className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`rise-in size-10 ${i < stars ? "fill-warning-500 text-warning-500" : "fill-none text-muted"}`}
          style={{ animationDelay: `${i * 120}ms` }}
        >
          <path d={STAR} stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
}

const VERDICT_TEXT = {
  within: "✓ Within tolerance",
  outside: "✗ Outside tolerance",
  unmeasured: "Not measured",
} as const;

const DEVICE_VERDICT_TEXT = {
  match: "✓ Matches the table",
  mismatch: "✗ Doesn't match the table",
  unpicked: "Not picked",
} as const;

const graft = (value: number | null) => (value === null ? "No standard device" : `${value} mm`);

/** A reach or a landing window, rounded to the millimetre: "152 mm", "123–143 mm", or "up to 96 mm" for the gate. */
const span = (r: Reach) => {
  const [min, max] = [Math.round(r.min), Math.round(r.max)];
  if (min === 0) return `up to ${max} mm`;
  return min === max ? `${min} mm` : `${min}–${max} mm`;
};

const LENGTH_VERDICT_TEXT: Record<LengthGrade["verdict"], string> = {
  match: "✓ Lands",
  mismatch: "✗ Misses",
  unpicked: "Not picked",
};

const points = (value: number) => String(Math.round(value));

type Props = {
  open: boolean;
  outcome: Outcome;
  rows: readonly TaskScore[];
  grades: readonly DeviceGrade[];
  lengths: readonly LengthGrade[];
  evarCase: EvarCase;
  override: ReferenceRow | null;
  elapsedMs: number;
  /** The best for this level and case before this attempt, so a tie isn't called a new best. */
  bestBefore: number | null;
  onReview: () => void;
  onTryAgain: () => void;
  /** Null on a level with only one case. */
  onNextCase: (() => void) | null;
};

/**
 * The end of a case: stars and points up top, then the same task-by-task and
 * device tables the practice always had, then the debrief. Closing it goes
 * back to the scan, so the answers can be checked against the images.
 */
export default function ResultsDialog({
  open,
  outcome,
  rows,
  grades,
  lengths,
  evarCase,
  override,
  elapsedMs,
  bestBefore,
  onReview,
  onTryAgain,
  onNextCase,
}: Props) {
  const checks = [...grades, ...lengths];
  const matched = checks.filter((row) => row.verdict === "match").length;
  const newBest = outcome.total > 0 && (bestBefore === null || outcome.total > bestBefore);

  return (
    <Modal open={open} onClose={onReview} aria-labelledby="evar-results-heading" className="w-full max-w-3xl">
      <Modal.Header>
        <h2 id="evar-results-heading" className="text-lg font-bold text-foreground">
          How you did
        </h2>
      </Modal.Header>
      <Modal.Body>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <StarRow stars={outcome.stars} />
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.13em] text-muted">
              {outcome.stars} of 3 stars
            </p>
            <p className="font-mono text-4xl font-bold text-foreground">{outcome.total} points</p>
          </div>
          {newBest ? (
            <p className="rise-in rounded-full border border-warning-500 px-3 py-1 text-[14px] font-semibold text-foreground">
              New personal best
            </p>
          ) : bestBefore === null ? null : (
            <p className="text-[14px] text-muted">Your best here is {bestBefore}.</p>
          )}
        </div>

        <dl aria-label="Breakdown" className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Measurements", value: points(outcome.measurementPoints) },
            { label: "Devices", value: points(outcome.devicePoints) },
            { label: "Time bonus", value: points(outcome.timeBonus) },
            { label: "Level", value: `×${outcome.multiplier}` },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border px-3 py-2">
              <dt className="text-[12px] text-muted">{item.label}</dt>
              <dd className="font-mono text-lg font-semibold text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 mb-1 text-[15px] font-semibold text-foreground">
          {outcome.within} of {rows.length} within tolerance, in {clock(elapsedMs)}.
        </p>
        <p className="mb-3 text-[14px] text-muted">
          {matched} of {checks.length} device checks match the sizing sheet.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <caption className="mb-2 text-left text-[15px] font-bold text-foreground">Results</caption>
            <thead className="text-muted">
              <tr>
                <th scope="col" className="py-1.5 pr-3 font-medium">Measurement</th>
                <th scope="col" className="py-1.5 pr-3 font-medium">Yours</th>
                <th scope="col" className="py-1.5 pr-3 font-medium">Reference</th>
                <th scope="col" className="py-1.5 pr-3 font-medium">Off by</th>
                <th scope="col" className="py-1.5 font-medium">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <th scope="row" className="py-2 pr-3 font-normal text-foreground">{row.label}</th>
                  <td className="py-2 pr-3 font-mono">{row.yours === null ? "–" : mm(row.yours)}</td>
                  <td className="py-2 pr-3 font-mono">{mm(row.reference)}</td>
                  <td className="py-2 pr-3 font-mono">
                    {row.delta === null ? "–" : `${row.delta > 0 ? "+" : ""}${row.delta.toFixed(1)}`}
                  </td>
                  <td className={`py-2 ${row.verdict === "within" ? "font-semibold text-foreground" : "text-muted"}`}>
                    {VERDICT_TEXT[row.verdict]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {override ? (
          <p className="mt-3 text-[13px] text-muted">
            Reference answers for this case were set by hand{override.note ? `: ${override.note}` : "."}
          </p>
        ) : null}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <caption className="mb-2 text-left text-[15px] font-bold text-foreground">Devices</caption>
            <thead className="text-muted">
              <tr>
                <th scope="col" className="py-1.5 pr-3 font-medium">Seals</th>
                <th scope="col" className="py-1.5 pr-3 font-medium">Picked</th>
                <th scope="col" className="py-1.5 pr-3 font-medium">Table, real anatomy</th>
                <th scope="col" className="py-1.5 pr-3 font-medium">Table, your numbers</th>
                <th scope="col" className="py-1.5 font-medium">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <th scope="row" className="py-2 pr-3 font-normal text-foreground">{row.label}</th>
                  <td className="py-2 pr-3 font-mono">{row.code === null ? "–" : `${row.code} (${row.picked} mm)`}</td>
                  <td className="py-2 pr-3 font-mono">{graft(row.expected)}</td>
                  <td className="py-2 pr-3 font-mono">{row.fromYours === undefined ? "–" : graft(row.fromYours)}</td>
                  <td className={`py-2 ${row.verdict === "match" ? "font-semibold text-foreground" : "text-muted"}`}>
                    {DEVICE_VERDICT_TEXT[row.verdict]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <caption className="mb-2 text-left text-[15px] font-bold text-foreground">Lengths</caption>
            <thead className="text-muted">
              <tr>
                <th scope="col" className="py-1.5 pr-3 font-medium">Check</th>
                <th scope="col" className="py-1.5 pr-3 font-medium">Picked</th>
                <th scope="col" className="py-1.5 pr-3 font-medium">Has to end, real anatomy</th>
                <th scope="col" className="py-1.5 pr-3 font-medium">Has to end, your marks</th>
                <th scope="col" className="py-1.5 font-medium">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {lengths.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <th scope="row" className="py-2 pr-3 font-normal text-foreground">{row.label}</th>
                  <td className="py-2 pr-3 font-mono">{row.picked === null ? "–" : span(row.picked)}</td>
                  <td className="py-2 pr-3 font-mono">{span(row.window)}</td>
                  <td className="py-2 pr-3 font-mono">{row.fromYours === undefined ? "–" : span(row.fromYours)}</td>
                  <td className={`py-2 ${row.verdict === "match" ? "font-semibold text-foreground" : "text-muted"}`}>
                    {LENGTH_VERDICT_TEXT[row.verdict]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[13px] text-muted">
            Lengths run down the centerline from the lowest renal. Each side has to end at least 15 mm into its
            common iliac and short of the internal iliac, and the contralateral gate has to end above the bifurcation.
          </p>
        </div>

        <p className="mt-4 text-[14px] leading-relaxed text-muted">{evarCase.debrief}</p>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex flex-wrap justify-end gap-2">
          <Link href="/evar/results" className={`${button} mr-auto`}>
            All your results
          </Link>
          <button type="button" className={button} onClick={onReview}>
            Review the scan
          </button>
          <button type="button" className={button} onClick={onTryAgain}>
            Try again
          </button>
          {onNextCase === null ? null : (
            <button type="button" className={`${button} border-foreground font-semibold`} onClick={onNextCase}>
              Next case
            </button>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
}
