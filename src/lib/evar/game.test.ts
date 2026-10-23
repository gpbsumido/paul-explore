import { describe, it, expect } from "vitest";
import { outcomeFor } from "./game";
import { LEVELS, type LevelId } from "./levels";
import { EVAR_CASES, referenceFor } from "./phantom";
import { TASKS, score, type Attempt } from "./measure";
import type { DeviceGrade } from "./endurant";

const reference = referenceFor(EVAR_CASES[0]);

const levelOf = (id: LevelId) => {
  const level = LEVELS.find((l) => l.id === id);
  if (!level) throw new Error(`no level ${id}`);
  return level;
};

/** Every measurement exactly on the reference. */
const perfect: Attempt = { ...reference };

/** The first `count` measurements exactly right, the rest left blank. */
const firstRight = (count: number): Attempt =>
  Object.fromEntries(TASKS.slice(0, count).map((t) => [t.id, reference[t.id]]));

const grade = (verdict: DeviceGrade["verdict"]): DeviceGrade => ({
  id: "mainBody",
  label: "Main body",
  code: null,
  picked: null,
  expected: 28,
  fromYours: undefined,
  verdict,
});

const allMatched = [grade("match"), grade("match"), grade("match")];

const play = ({
  attempt,
  levelId = "medium",
  grades = [],
  remainingMs = null,
}: {
  attempt: Attempt;
  levelId?: LevelId;
  grades?: DeviceGrade[];
  remainingMs?: number | null;
}) => {
  const level = levelOf(levelId);
  return outcomeFor({ scores: score(attempt, reference, level.tolerance), grades, level, remainingMs });
};

describe("outcomeFor", () => {
  it("gives a perfect Medium attempt with every device matched 975 points and 3 stars", () => {
    const outcome = play({ attempt: perfect, grades: allMatched });
    expect(outcome.measurementPoints).toBe(500);
    expect(outcome.devicePoints).toBe(150);
    expect(outcome.multiplier).toBe(1.5);
    expect(outcome.total).toBe(975);
    expect(outcome.stars).toBe(3);
  });

  it("still pays 50 for a measurement right on the tolerance edge", () => {
    const outcome = play({ attempt: { neckDiameter: reference.neckDiameter + 2 } });
    expect(outcome.measurementPoints).toBeCloseTo(50);
    expect(outcome.total).toBe(75);
  });

  it("pays nothing for a measurement outside tolerance or a device that doesn't match", () => {
    const outcome = play({
      attempt: { neckDiameter: reference.neckDiameter + 2.5 },
      grades: [grade("mismatch"), grade("unpicked")],
    });
    expect(outcome.measurementPoints).toBe(0);
    expect(outcome.devicePoints).toBe(0);
    expect(outcome.total).toBe(0);
  });

  it("scales a near miss by how close it was and rounds the total", () => {
    const outcome = play({ attempt: { neckDiameter: reference.neckDiameter - 0.5 } });
    expect(outcome.measurementPoints).toBeCloseTo(87.5);
    expect(outcome.total).toBe(131);
  });

  it("adds a time bonus on Hard and doubles everything", () => {
    const outcome = play({ attempt: perfect, levelId: "hard", grades: allMatched, remainingMs: 150_000 });
    expect(outcome.timeBonus).toBe(50);
    expect(outcome.total).toBe(1400);
  });

  it("gives no time bonus when the clock ran out", () => {
    const outcome = play({ attempt: perfect, levelId: "hard", remainingMs: 0 });
    expect(outcome.timeBonus).toBe(0);
    expect(outcome.total).toBe(1000);
  });

  it("doesn't multiply Easy", () => {
    expect(play({ attempt: perfect, levelId: "easy" }).total).toBe(500);
  });

  it.each([
    [5, 3],
    [4, 2],
    [3, 1],
    [2, 0],
    [0, 0],
  ])("turns %i measurements within tolerance into %i stars", (right, stars) => {
    const outcome = play({ attempt: firstRight(right) });
    expect(outcome.within).toBe(right);
    expect(outcome.stars).toBe(stars);
  });
});
