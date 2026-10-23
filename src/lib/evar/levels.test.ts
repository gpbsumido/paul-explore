import { describe, it, expect } from "vitest";
import { LEVELS, casesFor, hintsFor } from "./levels";
import { EVAR_CASES, referenceFor } from "./phantom";
import { TOLERANCE_MM } from "./measure";

const level = (id: string) => LEVELS.find((l) => l.id === id)!;

describe("LEVELS", () => {
  it("goes easy, medium, hard", () => {
    expect(LEVELS.map((l) => l.id)).toEqual(["easy", "medium", "hard"]);
  });

  it("only times Hard, at five minutes", () => {
    expect(level("easy").timeLimitMs).toBeNull();
    expect(level("medium").timeLimitMs).toBeNull();
    expect(level("hard").timeLimitMs).toBe(5 * 60 * 1000);
  });

  it("only gives hints on Easy", () => {
    expect(LEVELS.map((l) => l.hints)).toEqual([true, false, false]);
  });

  it("is more forgiving on Easy and standard everywhere else", () => {
    expect(level("easy").tolerance.neckDiameter).toBeGreaterThan(TOLERANCE_MM.neckDiameter);
    expect(level("easy").tolerance.neckLength).toBeGreaterThan(TOLERANCE_MM.neckLength);
    expect(level("medium").tolerance).toEqual(TOLERANCE_MM);
    expect(level("hard").tolerance).toEqual(TOLERANCE_MM);
  });

  it("points every level at real cases, and saves the hostile neck for Hard", () => {
    LEVELS.forEach((l) => {
      expect(casesFor(l).map((c) => c.id)).toEqual(l.caseIds);
    });
    expect(level("hard").caseIds).toContain("hostile-neck");
    expect(level("easy").caseIds).not.toContain("hostile-neck");
    expect(level("medium").caseIds).not.toContain("hostile-neck");
  });
});

describe("hintsFor", () => {
  it("gives slice ranges, counted from 1, that contain the real answer", () => {
    const evarCase = EVAR_CASES[0];
    const ref = referenceFor(evarCase);
    const hints = hintsFor(evarCase);
    const range = (label: RegExp) => hints.find((h) => label.test(h.label))!;

    const renal = range(/lowest renal/i);
    expect(renal.from).toBeLessThanOrEqual(evarCase.lowestRenalSlice + 1);
    expect(renal.to).toBeGreaterThanOrEqual(evarCase.lowestRenalSlice + 1);

    const start = range(/aneurysm start/i);
    expect(start.from).toBeLessThanOrEqual(ref.sacStartSlice + 1);
    expect(start.to).toBeGreaterThanOrEqual(ref.sacStartSlice + 1);

    const widest = range(/widest/i);
    expect(widest.from).toBeLessThanOrEqual(evarCase.sacPeakSlice + 1);
    expect(widest.to).toBeGreaterThanOrEqual(evarCase.sacPeakSlice + 1);
  });

  it("doesn't centre the range on the answer, so the midpoint isn't a giveaway", () => {
    const evarCase = EVAR_CASES[0];
    const renal = hintsFor(evarCase).find((h) => /lowest renal/i.test(h.label))!;
    expect((renal.from + renal.to) / 2).not.toBe(evarCase.lowestRenalSlice + 1);
  });
});
