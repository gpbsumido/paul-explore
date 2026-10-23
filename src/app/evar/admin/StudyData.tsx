"use client";

import { useId } from "react";
import Link from "next/link";
import { downloadCsv, downloadText } from "@/lib/csv";
import { toStudyCsv, toStudyRows } from "@/lib/evar/studyExport";
import { useStudyExport } from "./useStudyExport";

const button =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Today's date for the filename, so a folder of exports sorts itself. */
const stamp = () => new Date().toISOString().slice(0, 10);

/**
 * The whole study, downloadable. CSV is one line per attempt with the training
 * profile alongside, ready for a spreadsheet or R; JSON is the export exactly as
 * the API sent it, for when the flattening loses something.
 */
export default function StudyData() {
  const headingId = useId();
  const study = useStudyExport();

  const data = study.data;
  const empty = data ? data.attempts.length === 0 : true;

  return (
    <section aria-labelledby={headingId} className="mt-8 rounded-xl border border-border bg-surface p-4">
      <h2 id={headingId} className="text-xl font-bold text-foreground">
        Study data
      </h2>
      {study.isPending ? <p className="mt-2 text-[14px] text-muted">Loading the study data…</p> : null}
      {study.isError ? (
        <p className="mt-2 text-[14px] text-foreground">Couldn&apos;t load the study data. Try reloading.</p>
      ) : null}
      {data ? (
        <p className="mt-2 text-[14px] text-muted">
          {empty
            ? "No attempts recorded yet."
            : `${plural(data.attempts.length, "attempt")} from ${plural(data.participants.length, "participant")}.`}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={button}
          disabled={empty}
          onClick={() => data && downloadCsv(`evar-study-${stamp()}.csv`, toStudyCsv(toStudyRows(data)))}
        >
          Download CSV
        </button>
        <button
          type="button"
          className={button}
          disabled={!data}
          onClick={() =>
            data && downloadText(`evar-study-${stamp()}.json`, JSON.stringify(data, null, 2), "application/json")
          }
        >
          Download JSON
        </button>
        <Link href="/evar/admin/results" className={button}>
          See the results
        </Link>
      </div>
    </section>
  );
}
