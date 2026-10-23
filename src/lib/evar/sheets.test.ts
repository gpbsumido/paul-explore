import { describe, it, expect } from "vitest";
import { SHEETS, gradeDevices, gradeLengths } from "./sheets";
import { EVAR_CASES, referenceFor, anatomyFor } from "./phantom";
import type { DevicePick, SheetId } from "./devices";

const long = EVAR_CASES.find((c) => c.id === "long-neck")!;

describe("the same anatomy on every sheet", () => {
  it("takes a different limb for a 22 mm iliac depending on whose table it is", () => {
    const wide = { ...referenceFor(long), leftCia: 22 };
    const expected = (sheet: SheetId) =>
      gradeDevices({ sheet, ipsilateral: "right", mainBody: null, contraLimb: null, ipsiExtension: null }, wide, {}).find(
        (g) => g.id === "contralateral",
      )!.expected;
    expect(expected("endurant")).toEqual([24]);
    expect(expected("excluder")).toEqual([27]);
    expect(expected("zenith-alpha")).toEqual([]);
  });

  it("leaves every case with a stack that lands on both sides, whichever sheet and side", () => {
    (Object.keys(SHEETS) as SheetId[]).forEach((sheet) => {
      const { mainBodies, contraLimbs, ipsiExtensions } = SHEETS[sheet].catalogue;
      const bodies = mainBodies.flatMap((g) => g.devices);
      const contras = contraLimbs.flatMap((g) => g.devices);
      const ipsis = [null, ...ipsiExtensions.flatMap((g) => g.devices)];
      EVAR_CASES.forEach((c) => {
        const anatomy = anatomyFor(c);
        (["right", "left"] as const).forEach((side) => {
          const lands = bodies.some((m) =>
            contras.some((l) =>
              ipsis.some((e) => {
                const pick: DevicePick = { sheet, ipsilateral: side, mainBody: m.code, contraLimb: l.code, ipsiExtension: e?.code ?? null };
                return gradeLengths(pick, anatomy, {}).every((r) => r.verdict === "match");
              }),
            ),
          );
          expect(lands, `${sheet} ${c.id} ${side}`).toBe(true);
        });
      });
    });
  });
});
