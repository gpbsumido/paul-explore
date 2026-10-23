"use client";

import Modal from "@/components/ui/Modal";
import { TASKS, type Attempt } from "@/lib/evar/measure";
import { mm } from "./format";

const button =
  "paul-touch-min rounded-lg border border-border bg-surface px-4 py-2 text-[14px] text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";

type Props = {
  open: boolean;
  title: string;
  attempt: Attempt;
  debrief: string;
  onReview: () => void;
  onTryAgain: () => void;
  /** Null on a level with only one case. */
  onNextCase: (() => void) | null;
};

/**
 * The end of a real case nobody has measured yet: your numbers and the
 * debrief, with no score, because there's nothing to score against. Nothing
 * is kept, here or in the study.
 */
export default function UnscoredDialog({ open, title, attempt, debrief, onReview, onTryAgain, onNextCase }: Props) {
  return (
    <Modal open={open} onClose={onReview} aria-labelledby="evar-unscored-heading" className="w-full max-w-2xl">
      <Modal.Header>
        <h2 id="evar-unscored-heading" className="text-lg font-bold text-foreground">
          Your measurements
        </h2>
      </Modal.Header>
      <Modal.Body>
        <p className="text-[14px] text-foreground">
          {title} isn&apos;t scored yet: nobody has measured it by hand, so there&apos;s no answer to
          check yours against. Nothing from this attempt is kept.
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-[14px] sm:grid-cols-2">
          {TASKS.map((task) => (
            <div key={task.id} className="flex justify-between gap-3 border-b border-border py-1.5">
              <dt className="text-muted">{task.label}</dt>
              <dd className="font-mono text-foreground">{attempt[task.id] === undefined ? "–" : mm(attempt[task.id] ?? 0)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[14px] leading-relaxed text-muted">{debrief}</p>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex flex-wrap justify-end gap-2">
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
