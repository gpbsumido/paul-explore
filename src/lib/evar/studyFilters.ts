/**
 * Narrowing the study export for the admin results page. Plain functions over
 * the joined rows, so the page can filter what it already fetched instead of
 * asking the API again.
 */

import { TASKS, type TaskId } from "./measure";
import type { StudyRow } from "./studyExport";

/** Null means "any". Dates are `YYYY-MM-DD`, compared as UTC days. */
export type StudyFilters = {
  level: string | null;
  caseId: string | null;
  trainingLevel: string | null;
  timedOut: boolean | null;
  from: string | null;
  to: string | null;
};

export const NO_FILTERS: StudyFilters = {
  level: null,
  caseId: null,
  trainingLevel: null,
  timedOut: null,
  from: null,
  to: null,
};

const day = (iso: string) => iso.slice(0, 10);

const matches = (row: StudyRow, f: StudyFilters) =>
  (f.level === null || row.level === f.level) &&
  (f.caseId === null || row.caseId === f.caseId) &&
  (f.trainingLevel === null || row.trainingLevel === f.trainingLevel) &&
  (f.timedOut === null || row.timedOut === f.timedOut) &&
  (f.from === null || day(row.submittedAt) >= f.from) &&
  (f.to === null || day(row.submittedAt) <= f.to);

/** The rows every set filter agrees on, in their original order. */
export function filterStudyRows(rows: readonly StudyRow[], filters: StudyFilters): StudyRow[] {
  return rows.filter((row) => matches(row, filters));
}

export type TaskSummary = { id: TaskId; measured: number; within: number };

export type StudySummary = { attempts: number; participants: number; tasks: TaskSummary[] };

/** How many attempts and people, and for each measurement how often it was taken and landed within tolerance. */
export function summarizeStudy(rows: readonly StudyRow[]): StudySummary {
  const scoresFor = (id: TaskId) => rows.flatMap((r) => r.scores.filter((s) => s.id === id && s.verdict !== "unmeasured"));
  return {
    attempts: rows.length,
    participants: new Set(rows.map((r) => r.participantId)).size,
    tasks: TASKS.map(({ id }) => {
      const scores = scoresFor(id);
      return { id, measured: scores.length, within: scores.filter((s) => s.verdict === "within").length };
    }),
  };
}
