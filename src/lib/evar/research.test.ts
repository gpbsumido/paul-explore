import { describe, it, expect } from "vitest";
import { toAttemptPayload, participantResponseSchema, attemptsResponseSchema } from "./research";
import { EVAR_CASES, referenceFor } from "./phantom";
import { score } from "./measure";
import { gradeDevices } from "./sheets";
import type { DevicePick } from "./devices";

const evarCase = EVAR_CASES[0];
const reference = referenceFor(evarCase);
const attempt = { neckDiameter: 22.4, neckLength: 24 };
const noDevices: DevicePick = { sheet: "endurant", ipsilateral: "right", mainBody: null, contraLimb: null, ipsiExtension: null };

const payload = (overrides: Partial<Parameters<typeof toAttemptPayload>[0]> = {}) =>
  toAttemptPayload({
    clientAttemptId: "44444444-4444-4444-8444-444444444444",
    caseId: evarCase.id,
    level: "medium",
    appVersion: "7.18.0",
    startedAt: Date.parse("2026-10-22T09:00:00.000Z"),
    finishedAt: Date.parse("2026-10-22T09:02:05.000Z"),
    timeLimitMs: null,
    attempt,
    scores: score(attempt, reference),
    devices: noDevices,
    grades: gradeDevices(noDevices, reference, attempt),
    ...overrides,
  });

describe("toAttemptPayload", () => {
  it("records the raw numbers, the times and the scores the page showed", () => {
    const body = payload();
    expect(body).toMatchObject({
      caseId: "long-neck",
      level: "medium",
      startedAt: "2026-10-22T09:00:00.000Z",
      submittedAt: "2026-10-22T09:02:05.000Z",
      durationMs: 125_000,
      timeLimitMs: null,
      timedOut: false,
      measurements: attempt,
    });
    expect(body.scores).toHaveLength(5);
    expect(body.scores[0]).toEqual({
      id: "neckDiameter",
      yours: 22.4,
      reference: reference.neckDiameter,
      verdict: "within",
    });
  });

  it("marks an attempt the clock ran out on", () => {
    const body = payload({
      level: "hard",
      timeLimitMs: 300_000,
      finishedAt: Date.parse("2026-10-22T09:05:00.000Z"),
    });
    expect(body.timedOut).toBe(true);
  });

  it("leaves devices out when none were picked, and keeps the grades when some were", () => {
    expect(payload().devices).toBeNull();

    const picked: DevicePick = { ...noDevices, mainBody: "ETBF2816C145EE" };
    const body = payload({ devices: picked, grades: gradeDevices(picked, reference, attempt) });
    expect(body.devices).toMatchObject({ ipsilateral: "right", mainBody: "ETBF2816C145EE", contraLimb: null });
    // The API's device schema is strict, and the codes already say whose sheet it was.
    expect(body.devices).not.toHaveProperty("sheet");
    expect(body.devices?.grades[0]).toEqual({
      id: "mainBody",
      code: "ETBF2816C145EE",
      picked: 28,
      expected: 28,
      verdict: "match",
    });
  });

  it("sends one expected size when a shared band edge allows two", () => {
    const gore: DevicePick = { ...noDevices, sheet: "excluder", contraLimb: "GORE-LEG-14.5-120" };
    const edge = { ...reference, leftCia: 13.5 };
    const body = payload({ devices: gore, grades: gradeDevices(gore, edge, attempt) });
    const contra = body.devices?.grades.find((g) => g.id === "contralateral");
    expect(contra?.expected).toBe(14.5);
  });
});

describe("response schemas", () => {
  it("reads a participant, or the lack of one", () => {
    expect(participantResponseSchema.parse({ participant: null }).participant).toBeNull();
    const parsed = participantResponseSchema.parse({
      participant: {
        id: "22222222-2222-4222-8222-222222222222",
        consentVersion: "2026-10-draft",
        consentedAt: "2026-10-22T09:00:00.000Z",
        trainingLevel: "resident",
        trainingYear: 3,
        specialty: null,
      },
    });
    expect(parsed.participant?.trainingLevel).toBe("resident");
  });

  it("refuses an attempts list that isn't one", () => {
    expect(attemptsResponseSchema.safeParse({ attempts: "nope" }).success).toBe(false);
  });
});
