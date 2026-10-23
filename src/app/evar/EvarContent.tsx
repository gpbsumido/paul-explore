"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import SliceViewer from "./SliceViewer";
import DevicePicker from "./DevicePicker";
import ResearchPanel from "./ResearchPanel";
import ResultsDialog from "./ResultsDialog";
import { clock, mm } from "./format";
import { APP_VERSION } from "@/lib/appVersion";
import { toAttemptPayload } from "@/lib/evar/research";
import { gradeDevices, type DevicePick } from "@/lib/evar/endurant";
import { outcomeFor } from "@/lib/evar/game";
import { readBest, recordBest, usePersonalBest } from "@/lib/evar/personalBest";
import { recordAttempt, type HistoryEntry } from "@/lib/evar/history";
import { referenceWithOverride, referencesResponseSchema } from "@/lib/evar/references";
import { queryKeys } from "@/lib/queryKeys";
import { LEVELS, casesFor, hintsFor, type Level, type LevelId } from "@/lib/evar/levels";
import {
  TASKS,
  WINDOWS,
  distanceMm,
  score,
  type Attempt,
  type Point,
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
  "paul-touch-min rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";

const pill =
  "paul-touch-min inline-flex cursor-pointer items-center rounded-full border border-border px-3 py-1 text-[13px] text-muted peer-checked:border-foreground peer-checked:bg-foreground/10 peer-checked:text-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-foreground/40";

/** A floating panel on the stage. */
const panel = "glass-card rounded-2xl p-4";

/**
 * The dock floats over the panels while scrolling, so it can't be glass: at
 * 72% the task rows behind it read straight through the slider and buttons.
 */
const dock = "rounded-2xl border border-border bg-surface/95 p-4 shadow-lg backdrop-blur";

/** The best for a level's case, read once when an attempt starts. */
const bestFor = (level: Level, index: number) => readBest(level.id, (casesFor(level)[index] ?? casesFor(level)[0]).id);

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
    <fieldset>
      <legend className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-muted">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-1.5">
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
 *
 * Laid out as a dark stage that fills the screen, with the controls floating
 * over it, because the scan is the thing to look at. Finishing a case opens a
 * scored popup with stars, points and a personal best to beat.
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
  const [showResults, setShowResults] = useState(false);
  const [bestAtStart, setBestAtStart] = useState(() => bestFor(LEVELS.find((l) => l.id === "medium") ?? LEVELS[0], 0));
  const [clientAttemptId, setClientAttemptId] = useState(() => crypto.randomUUID());

  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
  const cases = casesFor(level);
  const evarCase = cases[caseIndex] ?? cases[0];
  const limit = level.timeLimitMs;
  const remaining = limit === null ? null : limit - ((finishedAt ?? now) - startedAt);
  const best = usePersonalBest(level.id, evarCase.id);

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
      if (t - startedAt >= limit) {
        setFinishedAt(startedAt + limit);
        setShowResults(true);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [limit, finishedAt, startedAt]);

  const caliper = points.length === 2 ? distanceMm(points[0], points[1], evarCase.pixelMm) : null;
  const neckLength =
    marks.renal !== undefined && marks.sacStart !== undefined
      ? Math.abs(marks.sacStart - marks.renal) * evarCase.sliceMm
      : undefined;
  const attempt: Attempt = { ...recorded, ...(neckLength === undefined ? {} : { neckLength }) };

  const rows = score(attempt, reference, level.tolerance);
  const grades = gradeDevices(devices, reference, attempt);
  const outcome = finishedAt === null ? null : outcomeFor({ scores: rows, grades, level, remainingMs: remaining });
  const total = outcome?.total ?? null;

  // Writes to localStorage, not to state, so the popup keeps comparing against
  // the best as it stood when this attempt started.
  useEffect(() => {
    if (total !== null) recordBest(level.id, evarCase.id, total);
  }, [total, level.id, evarCase.id]);

  // Once per attempt, the same way the study records it, so reopening the
  // popup or re-rendering doesn't add the attempt again.
  const kept = useRef(new Set<string>());
  useEffect(() => {
    if (outcome === null || finishedAt === null || kept.current.has(clientAttemptId)) return;
    kept.current.add(clientAttemptId);
    const entry: HistoryEntry = {
      id: clientAttemptId,
      levelId: level.id,
      caseId: evarCase.id,
      finishedAt,
      within: outcome.within,
      stars: outcome.stars,
      total: outcome.total,
      timedOut: remaining !== null && remaining <= 0,
      deltas: Object.fromEntries(rows.flatMap((row) => (row.delta === null ? [] : [[row.id, row.delta]]))),
    };
    recordAttempt(entry);
  }, [outcome, rows, finishedAt, remaining, clientAttemptId, level.id, evarCase.id]);

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
          scores: rows,
          devices,
          grades,
        });

  const goToSlice = (next: number) => {
    setSlice(Math.min(evarCase.slices - 1, Math.max(0, next)));
    setPoints([]);
  };

  const placePoint = (point: Point) => setPoints((current) => (current.length >= 2 ? [point] : [...current, point]));

  const startOver = (index: number, nextLevel: Level = level) => {
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
    setShowResults(false);
    setBestAtStart(bestFor(nextLevel, index));
    setClientAttemptId(crypto.randomUUID());
  };

  const pickLevel = (id: LevelId) => {
    const next = LEVELS.find((l) => l.id === id) ?? LEVELS[0];
    setLevelId(next.id);
    startOver(0, next);
  };

  const checkAnswers = () => {
    setFinishedAt((f) => f ?? Date.now());
    setShowResults(true);
  };

  const status =
    points.length === 0
      ? "No caliper placed."
      : points.length === 1
        ? "First point placed. Place the second."
        : `Caliper ${mm(caliper ?? 0)}`;

  return (
    <PageShell colorA="var(--color-feature-evar)" colorB="var(--color-secondary-500)">
      <PageHeader breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "EVAR Sizing" }]} maxWidth="max-w-7xl" />

      <main>
        {/* The stage follows the site theme. Only the scan itself stays black, the way CT is read. */}
        <div className="text-foreground">
          <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-7xl flex-col gap-3 px-3 py-3 sm:px-4">
            <header className={`${panel} flex flex-wrap items-end gap-x-6 gap-y-3`}>
              <div className="mr-auto">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-muted">Practice</p>
                <h1 className="text-xl font-bold text-foreground">EVAR sizing</h1>
              </div>
              <PillGroup
                legend="Level"
                name="evar-level"
                options={LEVELS.map((l) => ({ value: l.id, label: l.label }))}
                value={levelId}
                onChange={(value) => pickLevel(LEVELS.find((l) => l.id === value)?.id ?? "medium")}
              />
              <PillGroup
                legend="Case"
                name="evar-case"
                options={cases.map((c, i) => ({ value: String(i), label: c.title }))}
                value={String(caseIndex)}
                onChange={(value) => startOver(Number(value))}
              />
              {remaining === null ? null : (
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-muted">Time left</p>
                  <span role="timer" aria-label="Time left" className="font-mono text-2xl font-bold text-foreground">
                    {clock(remaining)}
                  </span>
                </div>
              )}
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-muted">Best</p>
                <p className="font-mono text-2xl font-bold text-foreground">{best ?? "–"}</p>
              </div>
              {remaining === null ? null : (
                <p aria-live="polite" className="basis-full text-[14px] font-semibold text-foreground empty:hidden">
                  {clockWarning(remaining)}
                </p>
              )}
            </header>

            <div className="grid flex-1 grid-cols-1 items-start gap-3 lg:grid-cols-[19rem_minmax(0,1fr)_17rem]">
              <section aria-label="Scan" className="flex flex-col items-center lg:col-start-2 lg:row-start-1">
                <SliceViewer
                  key={evarCase.id}
                  evarCase={evarCase}
                  slice={slice}
                  window={WINDOWS[windowId]}
                  points={points}
                  onPlace={placePoint}
                  onClear={() => setPoints([])}
                  onSliceStep={(delta) => goToSlice(slice + delta)}
                  className="max-w-[min(100%,calc(100dvh_-_17rem))]"
                />
              </section>

              <section
                aria-labelledby="evar-tasks-heading"
                className={`${panel} lg:col-start-1 lg:row-start-1`}
              >
                <h2 id="evar-tasks-heading" className="mb-1 text-lg font-bold text-foreground">
                  Measurements
                </h2>
                <p className="mb-2 text-[13px] text-muted">{evarCase.blurb}</p>
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

                <ul className="rounded-xl border border-border bg-surface px-3">
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
              </section>

              <div className={`${panel} lg:col-start-3 lg:row-start-1 [&>section]:mt-0`}>
                <DevicePicker pick={devices} onChange={setDevices} />
              </div>
            </div>

            <div className={`${dock} sticky bottom-3 z-20 flex flex-wrap items-center gap-x-5 gap-y-3`}>
              <PillGroup
                legend="Window"
                name="evar-window"
                options={Object.entries(WINDOWS).map(([id, w]) => ({ value: id, label: w.label }))}
                value={windowId}
                onChange={(value) => setWindowId(value === "soft" ? "soft" : "angio")}
              />
              <div className="min-w-48 flex-1">
                <label htmlFor="evar-slice" className="flex justify-between gap-2 text-[13px] text-muted">
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
                  className="paul-touch-min mt-1 w-full accent-foreground"
                />
              </div>
              <p role="status" className="min-w-40 font-mono text-[14px] text-foreground">
                {status}
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={button} onClick={() => setPoints([])} disabled={points.length === 0}>
                  Clear caliper
                </button>
                {finishedAt === null ? (
                  <button type="button" className={`${button} border-foreground font-semibold`} onClick={checkAnswers}>
                    Check answers
                  </button>
                ) : (
                  <button type="button" className={`${button} border-foreground font-semibold`} onClick={() => setShowResults(true)}>
                    Show results
                  </button>
                )}
                <button type="button" className={button} onClick={() => startOver(caseIndex)}>
                  Start over
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
          <section aria-labelledby="evar-about-heading" className="mb-10 max-w-3xl">
            <h2 id="evar-about-heading" className="mb-2 text-lg font-bold text-foreground">
              About this practice
            </h2>
            <p className="mb-3 text-[15px] leading-relaxed text-muted">
              Measure an abdominal aortic aneurysm the way you would before planning an
              endovascular repair: proximal neck diameter and length, the biggest sac diameter,
              and both common iliacs. The scans are synthetic CT phantoms built from exact
              geometry, so every answer is known to the tenth of a millimetre. They are not
              patient images.
            </p>
            <p className="text-[15px] leading-relaxed text-muted">
              {level.label}: {level.blurb} Points pay 50 to 100 for each measurement within
              tolerance and 50 for each device size that matches the table, with a time bonus on
              Hard, then scale by level. Stars count the measurements alone.
            </p>
          </section>

          <ResearchPanel submission={submission} />
        </div>

        {outcome === null || finishedAt === null ? null : (
          <ResultsDialog
            open={showResults}
            outcome={outcome}
            rows={rows}
            grades={grades}
            evarCase={evarCase}
            override={override}
            elapsedMs={finishedAt - startedAt}
            bestBefore={bestAtStart}
            onReview={() => setShowResults(false)}
            onTryAgain={() => startOver(caseIndex)}
            onNextCase={cases.length > 1 ? () => startOver((caseIndex + 1) % cases.length) : null}
          />
        )}
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
