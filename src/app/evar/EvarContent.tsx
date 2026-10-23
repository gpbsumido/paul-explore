"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import PageIntro from "@/components/PageIntro";
import SliceViewer from "./SliceViewer";
import DevicePicker from "./DevicePicker";
import ResearchPanel from "./ResearchPanel";
import { APP_VERSION } from "@/lib/appVersion";
import { toAttemptPayload } from "@/lib/evar/research";
import { gradeDevices, type DeviceGrade, type DevicePick } from "@/lib/evar/endurant";
import type { EvarCase } from "@/lib/evar/phantom";
import { referenceWithOverride, referencesResponseSchema, type ReferenceRow } from "@/lib/evar/references";
import { queryKeys } from "@/lib/queryKeys";
import { LEVELS, casesFor, hintsFor, type Level, type LevelId } from "@/lib/evar/levels";
import {
  TASKS,
  WINDOWS,
  distanceMm,
  score,
  type Attempt,
  type Point,
  type Reference,
  type TaskId,
  type WindowId,
} from "@/lib/evar/measure";

type DiameterTask = Exclude<TaskId, "neckLength">;
type Marks = { renal?: number; sacStart?: number };

const DIAMETER_TASKS = TASKS.filter((t): t is { id: DiameterTask; label: string } => t.id !== "neckLength");

const START_SLICE = 20;
const NO_DEVICES: DevicePick = { ipsilateral: "right", mainBody: null, contraLimb: null, ipsiExtension: null };
const TICK_MS = 250;

const button =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";

const pill =
  "cursor-pointer rounded-full border border-border px-3 py-1 text-[13px] text-muted peer-checked:border-foreground peer-checked:text-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-foreground/40";

const mm = (value: number) => `${value.toFixed(1)} mm`;

/** Milliseconds as m:ss, rounding up so the clock shows 0:00 only when it's out. */
const clock = (ms: number) => {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

/** What the timed level announces as it runs down: nothing, then a minute, then thirty seconds. */
const clockWarning = (remainingMs: number) => {
  if (remainingMs <= 0) return "Time's up. Your answers have been handed in.";
  if (remainingMs <= 30_000) return "30 seconds left.";
  if (remainingMs <= 60_000) return "1 minute left.";
  return "";
};

/** A labelled group of pill-styled native radios. */
function PillGroup({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="mb-4">
      <legend className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-muted">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className={pill}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** One row of the task panel: what it is, what's recorded, and the action. */
function TaskRow({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2.5 last:border-b-0">
      <span className="text-[14px] text-foreground">{label}</span>
      <span className="flex items-center gap-3">
        <span className="font-mono text-[13px] text-muted">{value}</span>
        {children}
      </span>
    </li>
  );
}

/**
 * EVAR sizing practice: scroll an axial CTA phantom, measure the neck, the sac
 * and the iliacs, then check the numbers against the case's exact references.
 */
export default function EvarContent() {
  const [levelId, setLevelId] = useState<LevelId>("medium");
  const [caseIndex, setCaseIndex] = useState(0);
  const [windowId, setWindowId] = useState<WindowId>("angio");
  const [slice, setSlice] = useState(START_SLICE);
  const [points, setPoints] = useState<readonly Point[]>([]);
  const [recorded, setRecorded] = useState<Partial<Record<DiameterTask, number>>>({});
  const [marks, setMarks] = useState<Marks>({});
  const [devices, setDevices] = useState<DevicePick>(NO_DEVICES);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [clientAttemptId, setClientAttemptId] = useState(() => crypto.randomUUID());

  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
  const cases = casesFor(level);
  const evarCase = cases[caseIndex] ?? cases[0];
  const limit = level.timeLimitMs;
  const remaining = limit === null ? null : limit - ((finishedAt ?? now) - startedAt);

  const overrides = useQuery({
    queryKey: queryKeys.evar.references(),
    queryFn: async () => {
      const res = await fetch("/api/evar/references");
      if (!res.ok) throw new Error(`GET /api/evar/references failed with ${res.status}`);
      return referencesResponseSchema.parse(await res.json()).references;
    },
    staleTime: 60_000,
  });
  const reference = referenceWithOverride(evarCase, overrides.data ?? []);
  const override = overrides.data?.find((row) => row.caseId === evarCase.id) ?? null;

  useEffect(() => {
    if (limit === null || finishedAt !== null) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t - startedAt >= limit) setFinishedAt(startedAt + limit);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [limit, finishedAt, startedAt]);

  const caliper = points.length === 2 ? distanceMm(points[0], points[1], evarCase.pixelMm) : null;
  const neckLength =
    marks.renal !== undefined && marks.sacStart !== undefined
      ? Math.abs(marks.sacStart - marks.renal) * evarCase.sliceMm
      : undefined;
  const attempt: Attempt = { ...recorded, ...(neckLength === undefined ? {} : { neckLength }) };

  const submission =
    finishedAt === null
      ? null
      : toAttemptPayload({
          clientAttemptId,
          caseId: evarCase.id,
          level: level.id,
          appVersion: APP_VERSION,
          startedAt,
          finishedAt,
          timeLimitMs: limit,
          attempt,
          scores: score(attempt, reference, level.tolerance),
          devices,
          grades: gradeDevices(devices, reference, attempt),
        });

  const goToSlice = (next: number) => {
    setSlice(Math.min(evarCase.slices - 1, Math.max(0, next)));
    setPoints([]);
  };

  const placePoint = (point: Point) => setPoints((current) => (current.length >= 2 ? [point] : [...current, point]));

  const startOver = (index: number) => {
    const t = Date.now();
    setCaseIndex(index);
    setSlice(START_SLICE);
    setPoints([]);
    setRecorded({});
    setMarks({});
    setDevices(NO_DEVICES);
    setStartedAt(t);
    setNow(t);
    setFinishedAt(null);
    setClientAttemptId(crypto.randomUUID());
  };

  const pickLevel = (id: LevelId) => {
    setLevelId(id);
    startOver(0);
  };

  const status =
    points.length === 0
      ? "No caliper placed."
      : points.length === 1
        ? "First point placed. Place the second."
        : `Caliper ${mm(caliper ?? 0)}`;

  return (
    <PageShell colorA="var(--color-feature-evar)" colorB="var(--color-secondary-500)">
      <PageHeader breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "EVAR Sizing" }]} maxWidth="max-w-5xl" />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <PageIntro
          eyebrow="Practice"
          title="EVAR sizing"
          lede={
            <>
              Measure an abdominal aortic aneurysm the way you would before planning an
              endovascular repair: proximal neck diameter and length, the biggest sac diameter,
              and both common iliacs. The scans are synthetic CT phantoms built from exact
              geometry, so every answer is known to the tenth of a millimetre. They are not
              patient images.
            </>
          }
        />

        <PillGroup
          legend="Level"
          name="evar-level"
          options={LEVELS.map((l) => ({ value: l.id, label: l.label }))}
          value={levelId}
          onChange={(value) => pickLevel(LEVELS.find((l) => l.id === value)?.id ?? "medium")}
        />
        <p className="-mt-2 mb-6 text-[14px] text-muted">{level.blurb}</p>

        <PillGroup
          legend="Case"
          name="evar-case"
          options={cases.map((c, i) => ({ value: String(i), label: c.title }))}
          value={String(caseIndex)}
          onChange={(value) => startOver(Number(value))}
        />
        <p className="-mt-2 mb-6 text-[14px] text-muted">{evarCase.blurb}</p>

        {remaining === null ? null : (
          <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="text-[13px] text-muted">
              Time left{" "}
              <span role="timer" aria-label="Time left" className="font-mono text-2xl font-bold text-foreground">
                {clock(remaining)}
              </span>
            </p>
            <p aria-live="polite" className="text-[14px] font-semibold text-foreground">
              {clockWarning(remaining)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,576px)_1fr]">
          <section aria-label="Scan">
            <PillGroup
              legend="Window"
              name="evar-window"
              options={Object.entries(WINDOWS).map(([id, w]) => ({ value: id, label: w.label }))}
              value={windowId}
              onChange={(value) => setWindowId(value === "soft" ? "soft" : "angio")}
            />

            <SliceViewer
              evarCase={evarCase}
              slice={slice}
              window={WINDOWS[windowId]}
              points={points}
              onPlace={placePoint}
              onClear={() => setPoints([])}
              onSliceStep={(delta) => goToSlice(slice + delta)}
            />

            <div className="mt-4">
              <label htmlFor="evar-slice" className="flex justify-between text-[13px] text-muted">
                <span>Slice</span>
                <span className="font-mono">
                  {slice + 1} / {evarCase.slices} · {slice * evarCase.sliceMm} mm
                </span>
              </label>
              <input
                id="evar-slice"
                type="range"
                min={0}
                max={evarCase.slices - 1}
                value={slice}
                aria-valuetext={`Slice ${slice + 1} of ${evarCase.slices}, ${slice * evarCase.sliceMm} mm from the top`}
                onChange={(event) => goToSlice(Number(event.target.value))}
                className="mt-1 w-full accent-foreground"
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <p role="status" className="font-mono text-[14px] text-foreground">
                {status}
              </p>
              <button type="button" className={button} onClick={() => setPoints([])} disabled={points.length === 0}>
                Clear caliper
              </button>
            </div>
          </section>

          <section aria-labelledby="evar-tasks-heading">
            <h2 id="evar-tasks-heading" className="mb-1 text-lg font-bold text-foreground">
              Measurements
            </h2>
            <p className="mb-3 text-[13px] text-muted">
              Diameters are outer wall to outer wall, thrombus included. The neck runs from the
              lowest renal artery to where the aorta first widens by more than 10%.
            </p>

            {level.hints ? (
              <ul aria-label="Hints" className="mb-3 list-disc pl-5 text-[13px] text-muted">
                {hintsFor(evarCase).map((hint) => (
                  <li key={hint.label}>
                    {hint.label}: somewhere in slices {hint.from} to {hint.to}
                  </li>
                ))}
              </ul>
            ) : null}

            <ul className="rounded-xl border border-border bg-surface px-4">
              <TaskRow label={DIAMETER_TASKS[0].label} value={recorded.neckDiameter === undefined ? "Not recorded" : mm(recorded.neckDiameter)}>
                <RecordButton label={DIAMETER_TASKS[0].label} disabled={caliper === null} onClick={() => caliper !== null && setRecorded((r) => ({ ...r, neckDiameter: caliper }))} />
              </TaskRow>
              <TaskRow label="Lowest renal artery" value={marks.renal === undefined ? "Not marked" : `Slice ${marks.renal + 1}`}>
                <button type="button" className={button} onClick={() => setMarks((m) => ({ ...m, renal: slice }))}>
                  Mark this slice{" "}<span className="sr-only">as lowest renal artery</span>
                </button>
              </TaskRow>
              <TaskRow label="Aneurysm start" value={marks.sacStart === undefined ? "Not marked" : `Slice ${marks.sacStart + 1}`}>
                <button type="button" className={button} onClick={() => setMarks((m) => ({ ...m, sacStart: slice }))}>
                  Mark this slice{" "}<span className="sr-only">as aneurysm start</span>
                </button>
              </TaskRow>
              <TaskRow label="Neck length" value={neckLength === undefined ? "Mark both slices" : mm(neckLength)}>
                <span />
              </TaskRow>
              {DIAMETER_TASKS.slice(1).map((task) => (
                <TaskRow key={task.id} label={task.label} value={recorded[task.id] === undefined ? "Not recorded" : mm(recorded[task.id] ?? 0)}>
                  <RecordButton label={task.label} disabled={caliper === null} onClick={() => caliper !== null && setRecorded((r) => ({ ...r, [task.id]: caliper }))} />
                </TaskRow>
              ))}
            </ul>

            <DevicePicker pick={devices} onChange={setDevices} />

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className={`${button} border-foreground font-semibold`}
                onClick={() => setFinishedAt((f) => f ?? Date.now())}
              >
                Check answers
              </button>
              <button type="button" className={button} onClick={() => startOver(caseIndex)}>
                Start over
              </button>
            </div>

            {finishedAt === null ? null : (
              <Results
                attempt={attempt}
                devices={devices}
                evarCase={evarCase}
                reference={reference}
                override={override}
                level={level}
                elapsedMs={finishedAt - startedAt}
              />
            )}
          </section>
        </div>

        <ResearchPanel submission={submission} />
      </main>
    </PageShell>
  );
}

/** "Record caliper", with the task name for screen readers. */
function RecordButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" className={button} disabled={disabled} onClick={onClick}>
      Record caliper{" "}<span className="sr-only">as {label}</span>
    </button>
  );
}

const VERDICT_TEXT = {
  within: "✓ Within tolerance",
  outside: "✗ Outside tolerance",
  unmeasured: "Not measured",
} as const;

/** Your numbers against the case's, task by task, plus what the anatomy means. */
function Results({
  attempt,
  devices,
  evarCase,
  reference,
  override,
  level,
  elapsedMs,
}: {
  attempt: Attempt;
  devices: DevicePick;
  evarCase: EvarCase;
  reference: Reference;
  override: ReferenceRow | null;
  level: Level;
  elapsedMs: number;
}) {
  const rows = score(attempt, reference, level.tolerance);
  const passed = rows.filter((row) => row.verdict === "within").length;
  const graded = gradeDevices(devices, reference, attempt);
  const matched = graded.filter((row) => row.verdict === "match").length;
  return (
    <div className="mt-6">
      <p className="mb-3 text-[15px] font-semibold text-foreground">
        {passed} of {rows.length} within tolerance, in {clock(elapsedMs)}.
      </p>
      <p className="mb-3 text-[14px] text-muted">
        {matched} of {graded.length} device sizes match the sizing table.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <caption className="mb-2 text-left text-lg font-bold text-foreground">Results</caption>
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
      <DeviceResults rows={graded} />
      <p className="mt-4 text-[14px] leading-relaxed text-muted">{evarCase.debrief}</p>
    </div>
  );
}

const DEVICE_VERDICT_TEXT = {
  match: "✓ Matches the table",
  mismatch: "✗ Doesn't match the table",
  unpicked: "Not picked",
} as const;

const graft = (mm: number | null) => (mm === null ? "No standard device" : `${mm} mm`);

/** Each picked diameter against the table, for the real anatomy and for your own numbers. */
function DeviceResults({ rows }: { rows: readonly DeviceGrade[] }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-left text-[13px]">
        <caption className="mb-2 text-left text-lg font-bold text-foreground">Devices</caption>
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
          {rows.map((row) => (
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
  );
}
