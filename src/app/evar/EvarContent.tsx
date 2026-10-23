"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import SliceViewer from "./SliceViewer";
import DevicePicker from "./DevicePicker";
import ResearchPanel from "./ResearchPanel";
import ResultsDialog from "./ResultsDialog";
import Disclosure from "./Disclosure";
import StudyWelcome from "./StudyWelcome";
import { usePersistentState } from "@/hooks/usePersistentState";
import { participantResponseSchema } from "@/lib/evar/research";
import FeatureTour from "@/components/GuidedTour/FeatureTour";
import type { TourStep } from "@/components/GuidedTour/types";
import UnscoredDialog from "./UnscoredDialog";
import { clock, mm } from "./format";
import { APP_VERSION } from "@/lib/appVersion";
import { toAttemptPayload } from "@/lib/evar/research";
import { SHEETS, gradeDevices, gradeLengths } from "@/lib/evar/sheets";
import type { DevicePick } from "@/lib/evar/devices";
import { anatomyFor, centerlineMm, sliceHU, type Landmarks, type MarkedAnatomy } from "@/lib/evar/phantom";
import { loadScan, scanSlice } from "@/lib/evar/scans";
import { outcomeFor } from "@/lib/evar/game";
import { readBest, recordBest, usePersonalBest } from "@/lib/evar/personalBest";
import { recordAttempt, type HistoryEntry } from "@/lib/evar/history";
import { referenceForCase, referencesResponseSchema } from "@/lib/evar/references";
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
type Marks = Partial<Landmarks> & { sacStart?: number };

/** Landmarks marked only for lengths: they feed device grading, not the five scored tasks. */
const LENGTH_MARKS: readonly { key: "bifurcation" | "rightInternalIliac" | "leftInternalIliac"; label: string }[] = [
  { key: "bifurcation", label: "Aortic bifurcation" },
  { key: "rightInternalIliac", label: "Right internal iliac origin" },
  { key: "leftInternalIliac", label: "Left internal iliac origin" },
];

const DIAMETER_TASKS = TASKS.filter((t): t is { id: DiameterTask; label: string } => t.id !== "neckLength");

const START_SLICE = 20;
const NO_DEVICES: DevicePick = { sheet: "endurant", ipsilateral: "right", mainBody: null, contraLimb: null, ipsiExtension: null };
const TICK_MS = 250;

type TaskTab = "measure" | "devices";

const TASK_TABS: readonly { id: TaskTab; label: string }[] = [
  { id: "measure", label: "Measure" },
  { id: "devices", label: "Size the graft" },
];

/**
 * The first-run walk round the page, on the same engine as ZeroProof's. The
 * measuring and devices steps open their tab, so the highlight lands on
 * something visible.
 */
const tourSteps = (showTab: (tab: TaskTab) => void): TourStep[] => [
  {
    title: "Take a quick tour?",
    body: "New to EVAR sizing? I'll show you round the page in a few clicks: where the scan is, what to measure, and how it gets checked.",
  },
  {
    anchor: "evar-intro",
    title: "Measure it the way you'd plan a repair",
    body: "Each case is a CT of an abdominal aortic aneurysm. Measure the neck, the sac and the iliacs, pick a stent graft, and see how close you got.",
  },
  {
    anchor: "evar-levels",
    title: "Levels",
    body: "Easy tells you which slices to look at and is forgiving. Medium has standard tolerances. Hard has the worst anatomy and five minutes on the clock.",
  },
  {
    anchor: "evar-cases",
    title: "Cases",
    body: "Each level has its own cases. Most are drawn from numbers, so the answers are exact; the last one on Medium is a real patient's scan.",
  },
  {
    anchor: "evar-scan",
    title: "The scan",
    body: "Scroll through the slices with the slider or Page Up and Page Down. Click two points to measure, drag to pan, and scroll or pinch to zoom. It all works from the keyboard too.",
  },
  {
    anchor: "evar-measurements",
    onEnter: () => showTab("measure"),
    title: "Measurements",
    body: "Record the caliper as each diameter, and mark the slices the lengths run between: the lowest renal, where the aneurysm starts, the bifurcation and the internal iliacs.",
  },
  {
    anchor: "evar-devices",
    onEnter: () => showTab("devices"),
    title: "Devices",
    body: "Pick a manufacturer, which side the main body goes up, and the sizes. They're graded against that manufacturer's own sizing table.",
  },
  {
    anchor: "evar-dock",
    title: "Check answers",
    body: "Switch between the angio and soft-tissue windows here, and press Check answers when you're done to see your score, what you missed, and why.",
  },
];
/** Stable empties for a scan with no reference, so effects that depend on them don't rerun every render. */
const NO_ROWS: ReturnType<typeof score> = [];
const NO_GRADES: ReturnType<typeof gradeDevices> = [];

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
  id,
  legend,
  name,
  options,
  value,
  onChange,
}: {
  /** For the guided tour to point at. */
  id?: string;
  legend: string;
  name: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset id={id}>
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
  const [tab, setTab] = useState<TaskTab>("measure");
  const [studyAsked, setStudyAsked] = usePersistentState("evar-study-asked", false);

  // The study is asked about before anything else, so it needs to know
  // whether you're signed in and whether you've already joined. Same queries
  // as the study panel, so react-query shares the answers.
  const me = useQuery({
    queryKey: queryKeys.me(),
    queryFn: (): Promise<{ sub: string | null; email: string | null }> =>
      fetch("/api/me").then((r) => (r.ok ? r.json() : { sub: null, email: null })),
    staleTime: 5 * 60_000,
  });
  const signedIn = Boolean(me.data?.sub);
  const participantQuery = useQuery({
    queryKey: queryKeys.evar.participant(),
    queryFn: async () => {
      const res = await fetch("/api/evar/participant");
      if (!res.ok) throw new Error(`GET /api/evar/participant failed with ${res.status}`);
      return participantResponseSchema.parse(await res.json()).participant;
    },
    enabled: signedIn,
  });
  const queryClient = useQueryClient();
  const joined = Boolean(participantQuery.data);
  const knowsStudy = !me.isPending && (!signedIn || !participantQuery.isPending);
  const askStudy = knowsStudy && !studyAsked && !joined;
  // The tour waits until the study question has been answered, or didn't need asking.
  const studySettled = knowsStudy && !askStudy;

  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
  const cases = casesFor(level);
  const evarCase = cases[caseIndex] ?? cases[0];
  const phantom = evarCase.kind === "phantom" ? evarCase : null;
  const scan = evarCase.kind === "scan" ? evarCase : null;
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
  const reference = referenceForCase(evarCase, overrides.data ?? []);

  // A real scan is a few MB, so it's fetched when its case is opened and kept for the visit.
  const volume = useQuery({
    queryKey: queryKeys.evar.scan(scan?.id ?? "none"),
    queryFn: () => (scan ? loadScan(scan) : Promise.resolve(null)),
    enabled: scan !== null,
    staleTime: Infinity,
  });
  const volumeData = volume.data ?? null;
  // A new function each render, which is fine: phantom and scan slices are
  // both cached where they're made, so asking again costs a map lookup.
  const sliceAt = (z: number): Int16Array | null => {
    if (phantom) return sliceHU(phantom, z);
    return scan && volumeData ? scanSlice(volumeData, scan, z) : null;
  };
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
  // A phantom measures along its centerline. A real scan has no centerline yet,
  // so its lengths run straight down the slices, and the page says so.
  const between = (from: number | undefined, to: number | undefined, side: "right" | "left" = "right") =>
    from === undefined || to === undefined
      ? undefined
      : phantom
        ? centerlineMm(phantom, from, to, side)
        : Math.abs(to - from) * evarCase.sliceMm;
  const neckLength = between(marks.renal, marks.sacStart);
  const attempt: Attempt = { ...recorded, ...(neckLength === undefined ? {} : { neckLength }) };

  const rows = reference ? score(attempt, reference, level.tolerance) : NO_ROWS;
  const grades = reference ? gradeDevices(devices, reference, attempt) : NO_GRADES;
  const yourAnatomy: MarkedAnatomy = phantom
    ? anatomyFor(phantom, marks)
    : {
        renalToBifurcation: between(marks.renal, marks.bifurcation),
        renalToInternalIliac: {
          right: between(marks.renal, marks.rightInternalIliac),
          left: between(marks.renal, marks.leftInternalIliac),
        },
      };
  const lengths = phantom ? gradeLengths(devices, anatomyFor(phantom), yourAnatomy) : [];
  const outcome =
    finishedAt === null || reference === null
      ? null
      : outcomeFor({ scores: rows, grades: [...grades, ...lengths], level, remainingMs: remaining });
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

  // An unscored scan has nothing to compare against, so nothing goes to the study either.
  const submission =
    finishedAt === null || reference === null
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

  const measuredCount = TASKS.filter((t) => attempt[t.id] !== undefined).length;
  const devicesStatus = devices.mainBody === null ? "Not started" : devices.contraLimb === null ? "Main body picked" : "Picked";
  const tabRefs = useRef<Partial<Record<TaskTab, HTMLButtonElement | null>>>({});
  const onTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = TASK_TABS.findIndex((t) => t.id === tab);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? TASK_TABS.length - 1
          : (index + (event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : TASK_TABS.length - 1)) % TASK_TABS.length;
    setTab(TASK_TABS[next].id);
    tabRefs.current[TASK_TABS[next].id]?.focus();
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
              <div id="evar-intro" className="mr-auto">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-muted">Practice</p>
                <h1 className="text-xl font-bold text-foreground">EVAR sizing</h1>
                {/* Best sits beside the tour button rather than in its own column, so the header keeps one row even with five cases. */}
                <div className="mt-2 flex items-center gap-3">
                  <p className="text-[13px] text-muted">
                    Best <span className="font-mono text-[15px] font-bold text-foreground">{best ?? "–"}</span>
                  </p>
                  <FeatureTour
                    label="EVAR sizing"
                    storageKey="evar-tour-seen"
                    steps={tourSteps(setTab)}
                    buttonLabel="Tour"
                    autoOpen={studySettled}
                  />
                </div>
              </div>
              <PillGroup
                id="evar-levels"
                legend="Level"
                name="evar-level"
                options={LEVELS.map((l) => ({ value: l.id, label: l.label }))}
                value={levelId}
                onChange={(value) => pickLevel(LEVELS.find((l) => l.id === value)?.id ?? "medium")}
              />
              <PillGroup
                id="evar-cases"
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
              {remaining === null ? null : (
                <p aria-live="polite" className="basis-full text-[14px] font-semibold text-foreground empty:hidden">
                  {clockWarning(remaining)}
                </p>
              )}
            </header>

            <div className="grid flex-1 grid-cols-1 items-start gap-3 lg:grid-cols-[22rem_minmax(0,1fr)]">
              <section id="evar-scan" aria-label="Scan" className="flex flex-col items-center lg:col-start-2 lg:row-start-1">
                <SliceViewer
                  key={evarCase.id}
                  size={evarCase.size}
                  sliceAt={sliceAt}
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
                id="evar-measurements"
                aria-label="Your work"
                className={`${panel} lg:col-start-1 lg:row-start-1`}
              >
                <div role="tablist" aria-label="Task" className="mb-3 grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1">
                  {TASK_TABS.map((t) => (
                    <button
                      key={t.id}
                      id={t.id === "devices" ? "evar-devices" : `evar-tab-${t.id}`}
                      ref={(el) => {
                        tabRefs.current[t.id] = el;
                      }}
                      type="button"
                      role="tab"
                      aria-selected={tab === t.id}
                      aria-controls={`evar-panel-${t.id}`}
                      tabIndex={tab === t.id ? 0 : -1}
                      onClick={() => setTab(t.id)}
                      onKeyDown={onTabKeyDown}
                      className={`rounded-lg px-3 py-2 text-left text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 ${
                        tab === t.id ? "bg-background font-semibold text-foreground shadow-sm" : "text-muted hover:text-foreground"
                      }`}
                    >
                      <span className="block">{t.label}</span>
                      <span className="block font-mono text-[12px] font-normal text-muted">
                        {t.id === "measure" ? `${measuredCount} of ${TASKS.length}` : devicesStatus}
                      </span>
                    </button>
                  ))}
                </div>

                <div id="evar-panel-measure" role="tabpanel" aria-labelledby="evar-tab-measure" hidden={tab !== "measure"}>
                  <h2 id="evar-tasks-heading" className="sr-only">
                    Measurements
                  </h2>
                  <p className="mb-2 text-[13px] text-muted">{evarCase.blurb}</p>
                  {scan ? (
                    <div className="mb-3 rounded-lg border border-border bg-surface px-3 py-2 text-[12px] text-muted">
                      <p>
                        Real scan: AVT case R6, {scan.attribution.licence}.
                      </p>
                      {reference === null ? (
                        <p className="mt-1.5 font-semibold text-foreground">
                          This scan isn&apos;t scored yet: nobody has measured it by hand. Practise on it, and
                          your numbers stay on this page.
                        </p>
                      ) : null}
                      <Disclosure label="Source and licence" className="mt-1.5">
                        <p>
                          {scan.attribution.text} Licence: {scan.attribution.licence}.{" "}
                          {scan.attribution.links.map((link, i) => (
                            <span key={link.href}>
                              {i > 0 ? " · " : null}
                              <a href={link.href} className="underline underline-offset-2" target="_blank" rel="noreferrer">
                                {link.label}
                              </a>
                            </span>
                          ))}
                        </p>
                        <p className="mt-1.5">Lengths on a real scan run straight down the slices.</p>
                      </Disclosure>
                    </div>
                  ) : null}

                  {level.hints && phantom ? (
                    <ul aria-label="Hints" className="mb-3 list-disc pl-5 text-[13px] text-muted">
                      {hintsFor(phantom).map((hint) => (
                        <li key={hint.label}>
                          {hint.label}: somewhere in slices {hint.from} to {hint.to}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <Disclosure label="How to measure" className="mb-3">
                    <p className="text-[13px] text-muted">
                      Diameters are outer wall to outer wall, thrombus included. On an oval neck, measure
                      across the short axis. The neck runs from the lowest renal artery to where the aorta
                      first widens by more than 10%.
                    </p>
                  </Disclosure>

                  <h3 className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-muted">Diameters</h3>
                  <ul className="mb-3 rounded-xl border border-border bg-surface px-3">
                    {DIAMETER_TASKS.map((task) => (
                      <TaskRow key={task.id} label={task.label} value={recorded[task.id] === undefined ? "Not recorded" : mm(recorded[task.id] ?? 0)}>
                        <RecordButton label={task.label} disabled={caliper === null} onClick={() => caliper !== null && setRecorded((r) => ({ ...r, [task.id]: caliper }))} />
                      </TaskRow>
                    ))}
                  </ul>

                  <h3 className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-muted">Neck length</h3>
                  <ul className="mb-3 rounded-xl border border-border bg-surface px-3">
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
                  </ul>

                  <Disclosure label="Landmarks for graft lengths" hint={phantom ? "optional, for length grading" : "optional"}>
                    <ul className="rounded-xl border border-border bg-surface px-3">
                      {LENGTH_MARKS.map(({ key, label }) => (
                        <TaskRow key={key} label={label} value={marks[key] === undefined ? "Not marked" : `Slice ${(marks[key] ?? 0) + 1}`}>
                          <button type="button" className={button} onClick={() => setMarks((m) => ({ ...m, [key]: slice }))}>
                            Mark this slice{" "}<span className="sr-only">as {label.toLowerCase()}</span>
                          </button>
                        </TaskRow>
                      ))}
                      <TaskRow label="Renal to bifurcation" value={yourAnatomy.renalToBifurcation === undefined ? "Mark both slices" : mm(yourAnatomy.renalToBifurcation)}>
                        <span />
                      </TaskRow>
                      {(["right", "left"] as const).map((side) => {
                        const length = yourAnatomy.renalToInternalIliac?.[side];
                        return (
                          <TaskRow key={side} label={`Renal to ${side} internal iliac`} value={length === undefined ? "Mark both slices" : mm(length)}>
                            <span />
                          </TaskRow>
                        );
                      })}
                    </ul>
                  </Disclosure>
                </div>

                <div id="evar-panel-devices" role="tabpanel" aria-labelledby="evar-devices" hidden={tab !== "devices"}>
                  <DevicePicker pick={devices} onChange={setDevices} gradesLengths={phantom !== null} />
                </div>
              </section>
            </div>

            <div id="evar-dock" className={`${dock} sticky bottom-3 z-20 flex flex-wrap items-center gap-x-5 gap-y-3`}>
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

        <StudyWelcome
          open={askStudy}
          signedIn={signedIn}
          onJoined={(participant) => {
            queryClient.setQueryData(queryKeys.evar.participant(), participant);
            setStudyAsked(true);
          }}
          onDecline={() => setStudyAsked(true)}
        />
        {finishedAt !== null && reference === null ? (
          <UnscoredDialog
            open={showResults}
            title={evarCase.title}
            attempt={attempt}
            debrief={evarCase.debrief}
            onReview={() => setShowResults(false)}
            onTryAgain={() => startOver(caseIndex)}
            onNextCase={cases.length > 1 ? () => startOver((caseIndex + 1) % cases.length) : null}
          />
        ) : null}
        {outcome === null || finishedAt === null ? null : (
          <ResultsDialog
            open={showResults}
            outcome={outcome}
            rows={rows}
            grades={grades}
            lengths={lengths}
            sheet={SHEETS[devices.sheet]}
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
