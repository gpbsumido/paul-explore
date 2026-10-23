/**
 * The opt-in research side of the EVAR practice: what the consent covers,
 * what an attempt looks like on the wire, and the shapes the API sends back.
 *
 * Nothing here runs for anyone who hasn't joined. Practice works the same
 * signed out or signed in; joining only adds a copy of each attempt to a
 * record that can be compared over a training career.
 */

import { z } from "zod";
import type { Attempt, TaskScore } from "./measure";
import type { DeviceGrade, DevicePick } from "./endurant";
import type { LevelId } from "./levels";

/**
 * Which consent text someone agreed to. Changing the text means changing this,
 * and the API re-stamps when consent was given. The text is a draft until the
 * study has ethics approval, and the version says so.
 */
export const CONSENT_VERSION = "2026-10-draft";

export const TRAINING_LEVELS = [
  { value: "medical-student", label: "Medical student" },
  { value: "resident", label: "Resident" },
  { value: "fellow", label: "Fellow" },
  { value: "attending", label: "Attending or consultant" },
  { value: "other", label: "Other" },
] as const;

export const participantResponseSchema = z.object({
  participant: z
    .object({
      id: z.string(),
      consentVersion: z.string(),
      consentedAt: z.string(),
      trainingLevel: z.string(),
      trainingYear: z.number().nullable(),
      specialty: z.string().nullable(),
    })
    .nullable(),
});

export type Participant = NonNullable<z.infer<typeof participantResponseSchema>["participant"]>;

const attemptSummarySchema = z.object({
  id: z.string(),
  caseId: z.string(),
  level: z.string(),
  submittedAt: z.string(),
  durationMs: z.number(),
  timedOut: z.boolean(),
  scores: z.array(z.object({ verdict: z.string() })),
});

export const attemptsResponseSchema = z.object({ attempts: z.array(attemptSummarySchema) });

export type AttemptPayload = {
  clientAttemptId: string;
  caseId: string;
  level: LevelId;
  appVersion: string;
  startedAt: string;
  submittedAt: string;
  durationMs: number;
  timeLimitMs: number | null;
  timedOut: boolean;
  measurements: Attempt;
  scores: { id: string; yours: number | null; reference: number; verdict: TaskScore["verdict"] }[];
  devices:
    | (DevicePick & {
        grades: { id: string; code: string | null; picked: number | null; expected: number | null; verdict: DeviceGrade["verdict"] }[];
      })
    | null;
};

/**
 * One attempt as the API stores it: the raw numbers, the times, and the
 * scores the page showed, trimmed to what a re-score or a paper needs.
 */
export function toAttemptPayload(input: {
  clientAttemptId: string;
  caseId: string;
  level: LevelId;
  appVersion: string;
  startedAt: number;
  finishedAt: number;
  timeLimitMs: number | null;
  attempt: Attempt;
  scores: readonly TaskScore[];
  devices: DevicePick;
  grades: readonly DeviceGrade[];
}): AttemptPayload {
  const durationMs = input.finishedAt - input.startedAt;
  const picked = input.devices.mainBody !== null || input.devices.contraLimb !== null || input.devices.ipsiExtension !== null;
  return {
    clientAttemptId: input.clientAttemptId,
    caseId: input.caseId,
    level: input.level,
    appVersion: input.appVersion,
    startedAt: new Date(input.startedAt).toISOString(),
    submittedAt: new Date(input.finishedAt).toISOString(),
    durationMs,
    timeLimitMs: input.timeLimitMs,
    timedOut: input.timeLimitMs !== null && durationMs >= input.timeLimitMs,
    measurements: input.attempt,
    scores: input.scores.map(({ id, yours, reference, verdict }) => ({ id, yours, reference, verdict })),
    devices: picked
      ? {
          ...input.devices,
          grades: input.grades.map(({ id, code, picked: diameter, expected, verdict }) => ({
            id,
            code,
            picked: diameter,
            expected,
            verdict,
          })),
        }
      : null,
  };
}
