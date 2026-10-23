import { describe, it, expect } from "vitest";
import { makeAttempt, makeParticipant, makeStudyExport } from "@/test/factories/evar";
import { toStudyRows } from "./studyExport";
import { NO_FILTERS, filterStudyRows, summarizeStudy } from "./studyFilters";

const resident = makeParticipant({ id: "p-resident", trainingLevel: "resident" });
const student = makeParticipant({ id: "p-student", trainingLevel: "medical-student" });

const rows = toStudyRows(
  makeStudyExport({
    participants: [resident, student],
    attempts: [
      makeAttempt({ id: "a1", participantId: "p-resident", level: "medium", caseId: "long-neck", submittedAt: "2026-10-10T23:30:00.000Z" }),
      makeAttempt({
        id: "a2",
        participantId: "p-resident",
        level: "hard",
        caseId: "hostile-neck",
        timedOut: true,
        submittedAt: "2026-10-12T08:00:00.000Z",
      }),
      makeAttempt({ id: "a3", participantId: "p-student", level: "easy", caseId: "small-sac", submittedAt: "2026-10-14T12:00:00.000Z" }),
    ],
  }),
);

const ids = (filtered: readonly { id: string }[]) => filtered.map((r) => r.id);

describe("filterStudyRows", () => {
  it("keeps everything with no filters", () => {
    expect(ids(filterStudyRows(rows, NO_FILTERS))).toEqual(["a1", "a2", "a3"]);
  });

  it("narrows by level", () => {
    expect(ids(filterStudyRows(rows, { ...NO_FILTERS, level: "hard" }))).toEqual(["a2"]);
  });

  it("narrows by case", () => {
    expect(ids(filterStudyRows(rows, { ...NO_FILTERS, caseId: "small-sac" }))).toEqual(["a3"]);
  });

  it("narrows by the participant's training level", () => {
    expect(ids(filterStudyRows(rows, { ...NO_FILTERS, trainingLevel: "resident" }))).toEqual(["a1", "a2"]);
  });

  it("narrows to timed-out attempts, or to the ones that weren't", () => {
    expect(ids(filterStudyRows(rows, { ...NO_FILTERS, timedOut: true }))).toEqual(["a2"]);
    expect(ids(filterStudyRows(rows, { ...NO_FILTERS, timedOut: false }))).toEqual(["a1", "a3"]);
  });

  it("treats from and to as whole UTC days, inclusive at both ends", () => {
    expect(ids(filterStudyRows(rows, { ...NO_FILTERS, from: "2026-10-10", to: "2026-10-12" }))).toEqual(["a1", "a2"]);
    expect(ids(filterStudyRows(rows, { ...NO_FILTERS, from: "2026-10-11" }))).toEqual(["a2", "a3"]);
    expect(ids(filterStudyRows(rows, { ...NO_FILTERS, to: "2026-10-10" }))).toEqual(["a1"]);
  });

  it("combines filters", () => {
    expect(ids(filterStudyRows(rows, { ...NO_FILTERS, trainingLevel: "resident", timedOut: false }))).toEqual(["a1"]);
  });
});

describe("summarizeStudy", () => {
  it("counts attempts and participants, and the share within tolerance for each measurement", () => {
    const summary = summarizeStudy(rows);
    expect(summary.attempts).toBe(3);
    expect(summary.participants).toBe(2);
    expect(summary.tasks.find((t) => t.id === "neckDiameter")).toEqual({ id: "neckDiameter", measured: 3, within: 3 });
    expect(summary.tasks.find((t) => t.id === "neckLength")).toEqual({ id: "neckLength", measured: 3, within: 0 });
  });

  it("doesn't count an unmeasured task as measured", () => {
    const [row] = toStudyRows(
      makeStudyExport({
        attempts: [
          makeAttempt({
            scores: [{ id: "maxSac", yours: null, reference: 60, verdict: "unmeasured" }],
          }),
        ],
      }),
    );
    expect(summarizeStudy([row]).tasks.find((t) => t.id === "maxSac")).toEqual({ id: "maxSac", measured: 0, within: 0 });
  });
});
