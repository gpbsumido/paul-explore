import type { ExportAttempt, ExportParticipant, StudyExport } from "@/lib/evar/studyExport";

/** A study participant, as the admin export sends them. */
export function makeParticipant(overrides: Partial<ExportParticipant> = {}): ExportParticipant {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    consentVersion: "2026-10-draft",
    consentedAt: "2026-10-01T09:00:00.000Z",
    trainingLevel: "resident",
    trainingYear: 3,
    specialty: null,
    ...overrides,
  };
}

/**
 * One recorded attempt on the long-neck case at Medium: four of five
 * measurements within tolerance, neck length off by 6 mm, and a main body
 * picked that matches the table.
 */
export function makeAttempt(overrides: Partial<ExportAttempt> = {}): ExportAttempt {
  return {
    id: "a0000000-0000-4000-8000-000000000001",
    participantId: "11111111-1111-4111-8111-111111111111",
    caseId: "long-neck",
    level: "medium",
    appVersion: "7.19.0",
    startedAt: "2026-10-10T10:00:00.000Z",
    submittedAt: "2026-10-10T10:03:30.000Z",
    durationMs: 210_000,
    timeLimitMs: null,
    timedOut: false,
    measurements: { neckDiameter: 24.5, neckLength: 36, maxSac: 60.2, rightCia: 13, leftCia: 12.6 },
    scores: [
      { id: "neckDiameter", yours: 24.5, reference: 24, verdict: "within" },
      { id: "neckLength", yours: 36, reference: 30, verdict: "outside" },
      { id: "maxSac", yours: 60.2, reference: 60, verdict: "within" },
      { id: "rightCia", yours: 13, reference: 13, verdict: "within" },
      { id: "leftCia", yours: 12.6, reference: 13, verdict: "within" },
    ],
    devices: {
      ipsilateral: "right",
      mainBody: "ETBF2816C145EE",
      contraLimb: null,
      ipsiExtension: null,
      grades: [
        { id: "mainBody", code: "ETBF2816C145EE", picked: 28, expected: 28, verdict: "match" },
        { id: "contralateral", code: null, picked: null, expected: 16, verdict: "unpicked" },
        { id: "ipsilateral", code: "ETBF2816C145EE", picked: 16, expected: 16, verdict: "match" },
      ],
    },
    ...overrides,
  };
}

/** The whole export: participants and their attempts. */
export function makeStudyExport(overrides: Partial<StudyExport> = {}): StudyExport {
  return { participants: [makeParticipant()], attempts: [makeAttempt()], ...overrides };
}
