/**
 * The EVAR study export, and the CSV it turns into.
 *
 * The API hands over participants and attempts separately, pseudonymous by
 * design: a random participant id and a training profile, never a name or an
 * email. Analysis wants one row per attempt with the profile alongside, and
 * each measurement and device grade as its own columns, so that's what the CSV
 * is.
 */

import { z } from "zod";
import { TASKS } from "./measure";
import { toCsv, type CsvColumn } from "@/lib/csv";

const participantSchema = z.object({
  id: z.string(),
  consentVersion: z.string(),
  consentedAt: z.string(),
  trainingLevel: z.string(),
  trainingYear: z.number().nullable(),
  specialty: z.string().nullable(),
});

const scoreSchema = z.object({
  id: z.string(),
  yours: z.number().nullable(),
  reference: z.number(),
  verdict: z.string(),
});

const gradeSchema = z.object({
  id: z.string(),
  code: z.string().nullable(),
  picked: z.number().nullable(),
  expected: z.number().nullable(),
  verdict: z.string(),
});

const attemptSchema = z.object({
  id: z.string(),
  participantId: z.string(),
  caseId: z.string(),
  level: z.string(),
  appVersion: z.string(),
  startedAt: z.string(),
  submittedAt: z.string(),
  durationMs: z.number(),
  timeLimitMs: z.number().nullable(),
  timedOut: z.boolean(),
  measurements: z.record(z.string(), z.number()),
  scores: z.array(scoreSchema),
  devices: z
    .object({
      ipsilateral: z.string(),
      mainBody: z.string().nullable(),
      contraLimb: z.string().nullable(),
      ipsiExtension: z.string().nullable(),
      grades: z.array(gradeSchema),
    })
    .nullable(),
});

export const studyExportSchema = z.object({
  participants: z.array(participantSchema),
  attempts: z.array(attemptSchema),
});

export type StudyExport = z.infer<typeof studyExportSchema>;
export type ExportParticipant = z.infer<typeof participantSchema>;
export type ExportAttempt = z.infer<typeof attemptSchema>;

/** One attempt with the training profile of whoever made it. */
export type StudyRow = ExportAttempt & {
  trainingLevel: string | null;
  trainingYear: number | null;
  specialty: string | null;
  consentVersion: string | null;
};

/** Joins every attempt to its participant. An orphan keeps an empty profile. */
export function toStudyRows(data: StudyExport): StudyRow[] {
  const byId = new Map(data.participants.map((p) => [p.id, p]));
  return data.attempts.map((attempt) => {
    const p = byId.get(attempt.participantId);
    return {
      ...attempt,
      trainingLevel: p?.trainingLevel ?? null,
      trainingYear: p?.trainingYear ?? null,
      specialty: p?.specialty ?? null,
      consentVersion: p?.consentVersion ?? null,
    };
  });
}

const GRADE_IDS = ["mainBody", "contralateral", "ipsilateral"] as const;

/** Blank for not measured or not picked, so a spreadsheet reads it as missing. */
const blank = (value: string | number | boolean | null | undefined): string | number =>
  value === null || value === undefined ? "" : typeof value === "boolean" ? String(value) : value;

const column = (header: string, value: (row: StudyRow) => string | number | boolean | null | undefined): CsvColumn<StudyRow> => ({
  header,
  value: (row) => blank(value(row)),
});

const COLUMNS: readonly CsvColumn<StudyRow>[] = [
  column("participant_id", (r) => r.participantId),
  column("training_level", (r) => r.trainingLevel),
  column("training_year", (r) => r.trainingYear),
  column("specialty", (r) => r.specialty),
  column("consent_version", (r) => r.consentVersion),
  column("attempt_id", (r) => r.id),
  column("case_id", (r) => r.caseId),
  column("level", (r) => r.level),
  column("app_version", (r) => r.appVersion),
  column("started_at", (r) => r.startedAt),
  column("submitted_at", (r) => r.submittedAt),
  column("duration_ms", (r) => r.durationMs),
  column("time_limit_ms", (r) => r.timeLimitMs),
  column("timed_out", (r) => r.timedOut),
  ...TASKS.flatMap(({ id }) => {
    const score = (r: StudyRow) => r.scores.find((s) => s.id === id);
    return [
      column(`${id}_yours`, (r) => score(r)?.yours),
      column(`${id}_reference`, (r) => score(r)?.reference),
      column(`${id}_verdict`, (r) => score(r)?.verdict),
    ];
  }),
  column("ipsilateral_side", (r) => r.devices?.ipsilateral),
  ...GRADE_IDS.flatMap((id) => {
    const grade = (r: StudyRow) => r.devices?.grades.find((g) => g.id === id);
    return [
      column(`${id}_code`, (r) => grade(r)?.code),
      column(`${id}_picked`, (r) => grade(r)?.picked),
      column(`${id}_expected`, (r) => grade(r)?.expected),
      column(`${id}_verdict`, (r) => grade(r)?.verdict ?? (r.devices ? undefined : "unpicked")),
    ];
  }),
];

/** One line per attempt, measurements and device grades as their own columns. */
export function toStudyCsv(rows: readonly StudyRow[]): string {
  return toCsv(rows, COLUMNS);
}
