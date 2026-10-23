"use client";

import { useId, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { downloadCsv } from "@/lib/csv";
import { LEVELS } from "@/lib/evar/levels";
import { TASKS } from "@/lib/evar/measure";
import { EVAR_CASES } from "@/lib/evar/phantom";
import { caseTitle } from "@/lib/evar/caseCatalogue";
import { useScanCases } from "@/lib/evar/useScanCases";
import { TRAINING_LEVELS } from "@/lib/evar/research";
import { toStudyCsv, toStudyRows, type StudyRow } from "@/lib/evar/studyExport";
import { NO_FILTERS, filterStudyRows, summarizeStudy, type StudyFilters } from "@/lib/evar/studyFilters";
import { clock } from "../../format";
import { useStudyExport } from "../useStudyExport";

const button =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";

const control =
  "mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-[14px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const stamp = () => new Date().toISOString().slice(0, 10);

const levelLabel = (id: string) => LEVELS.find((l) => l.id === id)?.label ?? id;
const trainingLabel = (value: string | null) =>
  value === null ? "–" : (TRAINING_LEVELS.find((t) => t.value === value)?.label ?? value);

const withinCount = (row: StudyRow) => row.scores.filter((s) => s.verdict === "within").length;

const orNull = (value: string) => (value === "" ? null : value);

type Option = { value: string; label: string };

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly Option[];
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-[13px] text-muted">
        {label}
      </label>
      <select id={id} className={control} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-[13px] text-muted">
        {label}
      </label>
      <input id={id} type="date" className={control} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/**
 * Everyone's recorded attempts, narrowed by level, case, training level,
 * timed out and date. Filters the export the admin page already fetched, and
 * downloads whatever the filters leave.
 */
export default function AdminResultsContent() {
  const study = useStudyExport();
  const { scans } = useScanCases();
  const [filters, setFilters] = useState<StudyFilters>(NO_FILTERS);
  const set = (patch: Partial<StudyFilters>) => setFilters((current) => ({ ...current, ...patch }));

  const rows = study.data ? toStudyRows(study.data) : [];
  const filtered = filterStudyRows(rows, filters);
  const summary = summarizeStudy(filtered);
  const timedOutValue = filters.timedOut === null ? "" : filters.timedOut ? "yes" : "no";

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "EVAR Sizing", href: "/evar" },
          { label: "Admin", href: "/evar/admin" },
          { label: "Results" },
        ]}
        maxWidth="max-w-5xl"
      />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">EVAR study results</h1>

        <fieldset className="mt-6 rounded-xl border border-border bg-surface p-4">
          <legend className="px-1 text-[14px] font-semibold text-foreground">Filters</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Select
              label="Level"
              value={filters.level ?? ""}
              options={LEVELS.map((l) => ({ value: l.id, label: l.label }))}
              onChange={(v) => set({ level: orNull(v) })}
            />
            <Select
              label="Case"
              value={filters.caseId ?? ""}
              options={[...EVAR_CASES, ...scans].map((c) => ({ value: c.id, label: c.title }))}
              onChange={(v) => set({ caseId: orNull(v) })}
            />
            <Select
              label="Training level"
              value={filters.trainingLevel ?? ""}
              options={TRAINING_LEVELS}
              onChange={(v) => set({ trainingLevel: orNull(v) })}
            />
            <Select
              label="Timed out"
              value={timedOutValue}
              options={[
                { value: "yes", label: "Timed out" },
                { value: "no", label: "Handed in" },
              ]}
              onChange={(v) => set({ timedOut: v === "" ? null : v === "yes" })}
            />
            <DateInput label="From" value={filters.from ?? ""} onChange={(v) => set({ from: orNull(v) })} />
            <DateInput label="To" value={filters.to ?? ""} onChange={(v) => set({ to: orNull(v) })} />
          </div>
          <p className="mt-3 text-[12px] text-muted">Dates are the day each attempt was submitted, in UTC, and include both ends.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={button} onClick={() => setFilters(NO_FILTERS)}>
              Clear filters
            </button>
            <button
              type="button"
              className={button}
              disabled={filtered.length === 0}
              onClick={() => downloadCsv(`evar-results-${stamp()}.csv`, toStudyCsv(filtered))}
            >
              Download these as CSV
            </button>
          </div>
        </fieldset>

        {study.isPending ? <p className="mt-6 text-[14px] text-muted">Loading the study data…</p> : null}
        {study.isError ? (
          <p className="mt-6 text-[14px] text-foreground">Couldn&apos;t load the study data. Try reloading.</p>
        ) : null}

        {study.data && filtered.length === 0 ? (
          <p className="mt-6 text-[14px] text-foreground">No attempts match these filters.</p>
        ) : null}

        {study.data && filtered.length > 0 ? (
          <>
            <p className="mt-6 text-[14px] text-muted">
              {`${plural(summary.attempts, "attempt")} from ${plural(summary.participants, "participant")}`}
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <caption className="mb-2 text-left text-xl font-bold text-foreground">Within tolerance by measurement</caption>
                <thead>
                  <tr className="text-[12px] text-muted">
                    <th scope="col" className="py-1.5 pr-3 font-medium">Measurement</th>
                    <th scope="col" className="py-1.5 pr-3 font-medium">Within, of measured</th>
                    <th scope="col" className="py-1.5 font-medium">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.tasks.map((t) => (
                    <tr key={t.id} className="border-t border-border">
                      <th scope="row" className="py-2 pr-3 font-normal text-foreground">
                        {TASKS.find((task) => task.id === t.id)?.label ?? t.id}
                      </th>
                      <td className="py-2 pr-3 font-mono">{`${t.within} of ${t.measured}`}</td>
                      <td className="py-2 font-mono">
                        {t.measured === 0 ? "–" : `${Math.round((t.within / t.measured) * 100)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <caption className="mb-2 text-left text-xl font-bold text-foreground">Attempts</caption>
                <thead>
                  <tr className="text-[12px] text-muted">
                    <th scope="col" className="py-1.5 pr-3 font-medium">Submitted</th>
                    <th scope="col" className="py-1.5 pr-3 font-medium">Participant</th>
                    <th scope="col" className="py-1.5 pr-3 font-medium">Training</th>
                    <th scope="col" className="py-1.5 pr-3 font-medium">Level</th>
                    <th scope="col" className="py-1.5 pr-3 font-medium">Case</th>
                    <th scope="col" className="py-1.5 pr-3 font-medium">Within tolerance</th>
                    <th scope="col" className="py-1.5 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-t border-border">
                      <td className="py-2 pr-3 font-mono text-muted">{row.submittedAt.slice(0, 16).replace("T", " ")}</td>
                      <td className="py-2 pr-3 font-mono">{row.participantId.slice(0, 8)}</td>
                      <td className="py-2 pr-3">{trainingLabel(row.trainingLevel)}</td>
                      <td className="py-2 pr-3">{levelLabel(row.level)}</td>
                      <th scope="row" className="py-2 pr-3 font-normal text-foreground">
                        {caseTitle(row.caseId, scans)}
                      </th>
                      <td className="py-2 pr-3 font-mono">{`${withinCount(row)} of 5`}</td>
                      <td className="py-2 font-mono">
                        {clock(row.durationMs)}
                        {row.timedOut ? <span className="ml-2 font-sans text-[12px] text-muted">(timed out)</span> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
