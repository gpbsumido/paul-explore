import { describe, it, expect } from "vitest";
import { EVAR_CASES, sliceHU, referenceFor, outerRadiusMm, neckOffsetMm, centerlineMm, anatomyFor } from "./phantom";

const huAt = (slice: Int16Array, size: number, x: number, y: number) =>
  slice[Math.round(y) * size + Math.round(x)];

const range = (from: number, to: number) => Array.from({ length: to - from }, (_, i) => from + i);

const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

/** How many pixels in a box have a value in [lo, hi]. */
const countIn = (slice: Int16Array, size: number, box: { x0: number; x1: number; y0: number; y1: number }, lo: number, hi: number) =>
  range(Math.max(0, Math.round(box.y0)), Math.min(size, Math.round(box.y1))).reduce(
    (sum, y) =>
      sum +
      range(Math.max(0, Math.round(box.x0)), Math.min(size, Math.round(box.x1))).filter((x) => {
        const hu = huAt(slice, size, x, y);
        return hu >= lo && hu <= hi;
      }).length,
    0,
  );

/**
 * The row through the middle of the vertebral body, found from the image
 * itself: the median of the marrow-density pixels down the midline.
 */
const spineRow = (slice: Int16Array, size: number) =>
  median(range(Math.round(size / 2), size).filter((y) => {
    const hu = huAt(slice, size, size / 2, y);
    return hu > 150 && hu < 350;
  }));

describe("EVAR phantom", () => {
  it("ships more than one case, each with its own anatomy", () => {
    expect(EVAR_CASES.length).toBeGreaterThanOrEqual(2);
    const refs = EVAR_CASES.map((c) => referenceFor(c));
    expect(refs[0]).not.toEqual(refs[1]);
  });

  it("puts contrast-filled lumen at the aortic centre on a neck slice", () => {
    const evarCase = EVAR_CASES[0];
    const z = evarCase.lowestRenalSlice + 2;
    const { x, y } = evarCase.centreAt(z);
    const slice = sliceHU(evarCase, z);
    expect(slice).toHaveLength(evarCase.size * evarCase.size);
    expect(huAt(slice, evarCase.size, x, y)).toBeGreaterThan(250);
  });

  it("leaves air outside the body", () => {
    const evarCase = EVAR_CASES[0];
    const slice = sliceHU(evarCase, 10);
    expect(huAt(slice, evarCase.size, 1, 1)).toBeLessThan(-900);
  });

  it("draws the outer wall at the radius the reference is built from", () => {
    const evarCase = EVAR_CASES[0];
    const z = evarCase.lowestRenalSlice + 2;
    const { x, y } = evarCase.centreAt(z);
    const radiusPx = outerRadiusMm(evarCase, z) / evarCase.pixelMm;
    const slice = sliceHU(evarCase, z);
    expect(huAt(slice, evarCase.size, x + radiusPx - 1, y)).toBeGreaterThan(0);
    expect(huAt(slice, evarCase.size, x + radiusPx + 3, y)).toBeLessThan(0);
  });

  it("is deterministic, so the same slice always looks the same", () => {
    const evarCase = EVAR_CASES[1];
    expect(sliceHU(evarCase, 40)).toEqual(sliceHU(evarCase, 40));
  });

  it("splits into two iliacs below the bifurcation", () => {
    const evarCase = EVAR_CASES[0];
    const z = evarCase.bifurcationSlice + 8;
    const slice = sliceHU(evarCase, z);
    const { right, left } = evarCase.iliacCentresAt(z);
    expect(huAt(slice, evarCase.size, right.x, right.y)).toBeGreaterThan(250);
    expect(huAt(slice, evarCase.size, left.x, left.y)).toBeGreaterThan(250);
    expect(right.x).toBeLessThan(left.x);
  });

  it("derives every reference from the geometry", () => {
    const evarCase = EVAR_CASES[0];
    const ref = referenceFor(evarCase);
    expect(ref.neckDiameter).toBeCloseTo(evarCase.neckRadiusMm * 2);
    expect(ref.maxSac).toBeCloseTo(evarCase.sacRadiusMm * 2, 0);
    expect(ref.rightCia).toBeCloseTo(evarCase.ciaRadiusMm.right * 2);
    expect(ref.leftCia).toBeCloseTo(evarCase.ciaRadiusMm.left * 2);
    expect(ref.neckLength).toBeCloseTo(centerlineMm(evarCase, evarCase.lowestRenalSlice, ref.sacStartSlice));
  });

  it("has a hostile case: a wide, short neck and an ectatic right iliac", () => {
    const hostile = EVAR_CASES.find((c) => c.id === "hostile-neck")!;
    const ref = referenceFor(hostile);
    expect(ref.neckDiameter).toBeCloseTo(30);
    // Five slices apart, but the neck leans 50°, so along the vessel it's longer than the 10 mm the slices suggest.
    expect(ref.sacStartSlice - hostile.lowestRenalSlice).toBe(5);
    expect(ref.neckLength).toBeGreaterThan(13);
    expect(ref.rightCia).toBeCloseTo(24);
    expect(ref.leftCia).toBeLessThan(ref.rightCia);
  });

  it("starts the sac where the diameter first passes 110% of the neck", () => {
    const evarCase = EVAR_CASES[1];
    const { sacStartSlice } = referenceFor(evarCase);
    const neck = evarCase.neckRadiusMm;
    expect(outerRadiusMm(evarCase, sacStartSlice)).toBeGreaterThan(neck * 1.1);
    expect(outerRadiusMm(evarCase, sacStartSlice - 1)).toBeLessThanOrEqual(
      neck * 1.1,
    );
  });

  it("names every case once, and gives each its own answers", () => {
    expect(new Set(EVAR_CASES.map((c) => c.id)).size).toBe(EVAR_CASES.length);
    expect(new Set(EVAR_CASES.map((c) => c.title)).size).toBe(EVAR_CASES.length);
    const refs = EVAR_CASES.map((c) => JSON.stringify(referenceFor(c)));
    expect(new Set(refs).size).toBe(EVAR_CASES.length);
  });

  describe("reads like an abdominal CTA", () => {
    it("has a faintly enhanced IVC on the patient's right of the aorta, and nothing like it on the left", () => {
      EVAR_CASES.forEach((c) => {
        const z = c.bifurcationSlice - 3;
        const slice = sliceHU(c, z);
        const { x, y } = c.centreAt(z);
        const aortaPx = outerRadiusMm(c, z) / c.pixelMm;
        const rows = { y0: y - 40, y1: y + 60 };
        const patientRight = countIn(slice, c.size, { ...rows, x0: x - aortaPx - 45, x1: x - aortaPx - 2 }, 80, 160);
        const patientLeft = countIn(slice, c.size, { ...rows, x0: x + aortaPx + 2, x1: x + aortaPx + 45 }, 80, 160);
        expect(patientRight, c.id).toBeGreaterThan(120);
        expect(patientLeft, c.id).toBeLessThan(40);
      });
    });

    it("has psoas muscle either side of the vertebral body low in the abdomen", () => {
      const c = EVAR_CASES[0];
      const slice = sliceHU(c, c.slices - 1);
      const y = spineRow(slice, c.size);
      [-1, 1].forEach((side) => {
        const outward = range(1, 120).map((step) => huAt(slice, c.size, c.size / 2 + side * step, y));
        const pastBone = outward.slice(outward.findIndex((hu) => hu <= 120));
        expect(pastBone.slice(0, 12).filter((hu) => hu >= 0 && hu <= 110).length).toBeGreaterThanOrEqual(8);
      });
    });

    it("has bone behind the spinal canal, not just a round vertebral body", () => {
      const c = EVAR_CASES[0];
      const slice = sliceHU(c, 60);
      const down = range(spineRow(slice, c.size), c.size).map((y) => huAt(slice, c.size, c.size / 2, y));
      const canalStart = down.findIndex((hu) => hu >= -30 && hu <= 60);
      const canal = down.slice(canalStart);
      const canalEnd = canal.findIndex((hu) => hu < -30 || hu > 60);
      expect(canalEnd).toBeGreaterThanOrEqual(8);
      expect(Math.max(...canal.slice(canalEnd, canalEnd + 6))).toBeGreaterThan(300);
    });

    it("has a liver on the patient's right at the top of the stack, gone by the pelvis", () => {
      const c = EVAR_CASES[0];
      const half = c.size / 2;
      const imbalance = (z: number) => {
        const slice = sliceHU(c, z);
        const solid = (x0: number, x1: number) => countIn(slice, c.size, { x0, x1, y0: 0, y1: c.size }, 55, 110);
        return solid(0, half) - solid(half, c.size);
      };
      expect(imbalance(0)).toBeGreaterThan(5000);
      expect(Math.abs(imbalance(c.slices - 1))).toBeLessThan(2000);
    });

    it("has a spleen on the patient's left up top, smaller than the liver", () => {
      const c = EVAR_CASES[0];
      const half = c.size / 2;
      const slice = sliceHU(c, 0);
      const solid = (x0: number, x1: number) => countIn(slice, c.size, { x0, x1, y0: 0, y1: c.size * 0.6 }, 85, 160);
      expect(solid(half + 60, c.size)).toBeGreaterThan(1500);
      expect(countIn(sliceHU(c, c.slices - 1), c.size, { x0: half + 60, x1: c.size, y0: 0, y1: c.size * 0.6 }, 85, 160)).toBeLessThan(200);
    });

    it("shows the kidneys in the arterial phase: bright cortex, darker medulla, fat in the sinus", () => {
      const c = EVAR_CASES[0];
      const z = c.lowestRenalSlice - 2;
      const slice = sliceHU(c, z);
      const kidneyRow = Math.round(c.size * 0.61);
      // The patient's left kidney, on the image's right, walked from its outer edge in toward the spine.
      const inward = range(0, 70).map((step) => huAt(slice, c.size, c.size - 40 - step, kidneyRow));
      const start = inward.findIndex((hu) => hu > 140);
      const kidney = inward.slice(start, start + 40);
      expect(Math.max(...kidney.slice(0, 8))).toBeGreaterThan(170);
      expect(kidney.slice(8, 20).some((hu) => hu > 70 && hu < 140)).toBe(true);
      expect(kidney.some((hu) => hu < -40)).toBe(true);
    });

    it("has gas in the bowel", () => {
      EVAR_CASES.forEach((c) => {
        const slice = sliceHU(c, 50);
        const middle = { x0: c.size * 0.3, x1: c.size * 0.7, y0: c.size * 0.32, y1: c.size * 0.5 };
        expect(countIn(slice, c.size, middle, -1100, -500), c.id).toBeGreaterThan(30);
      });
    });

    it("lies on a scanner table", () => {
      const c = EVAR_CASES[0];
      const slice = sliceHU(c, 40);
      const column = range(Math.round(c.size * 0.6), c.size).map((y) => huAt(slice, c.size, c.size / 2, y) > -500);
      const solidRuns = column.filter((solid, i) => solid && !column[i - 1]).length;
      expect(solidRuns).toBeGreaterThanOrEqual(2);
    });

    it("has grainy noise, so neighbouring pixels move together", () => {
      const c = EVAR_CASES[0];
      const pairs = range(c.lowestRenalSlice + 1, c.lowestRenalSlice + 7).flatMap((z) => {
        const slice = sliceHU(c, z);
        const { x, y } = c.centreAt(z);
        return range(-4, 5).flatMap((dy) =>
          range(-4, 4).map((dx) => [huAt(slice, c.size, x + dx, y + dy), huAt(slice, c.size, x + dx + 1, y + dy)]),
        );
      });
      const mean = pairs.reduce((sum, [a]) => sum + a, 0) / pairs.length;
      const cov = pairs.reduce((sum, [a, b]) => sum + (a - mean) * (b - mean), 0) / pairs.length;
      const variance = pairs.reduce((sum, [a]) => sum + (a - mean) ** 2, 0) / pairs.length;
      expect(cov / variance).toBeGreaterThan(0.3);
      expect(Math.sqrt(variance)).toBeGreaterThan(5);
    });

    it("blurs the lumen edge into the wall, the way partial volume does", () => {
      const c = EVAR_CASES[0];
      const z = c.lowestRenalSlice + 2;
      const slice = sliceHU(c, z);
      const { x, y } = c.centreAt(z);
      const radiusPx = outerRadiusMm(c, z) / c.pixelMm;
      const outward = range(0, Math.ceil(radiusPx) + 2).map((step) => huAt(slice, c.size, x + step, y));
      const edge = outward.findIndex((hu) => hu < 100);
      expect(outward.slice(0, edge + 1).some((hu) => hu > 100 && hu < 280)).toBe(true);
    });
  });

  describe("hostile necks", () => {
    const byId = (id: string) => EVAR_CASES.find((c) => c.id === id)!;

    /** Distance in pixels from a point to where the vessel ends, walking outward along a unit direction. */
    const edgePx = (slice: Int16Array, size: number, from: { x: number; y: number }, dir: { x: number; y: number }) => {
      const steps = range(0, 200).map((i) => i * 0.5);
      return steps.find((d) => huAt(slice, size, from.x + dir.x * d, from.y + dir.y * d) < -20) ?? Infinity;
    };

    const unit = (deg: number) => ({ x: Math.cos((deg * Math.PI) / 180), y: -Math.sin((deg * Math.PI) / 180) });

    it("gives every neck at least one thing a real one has: a taper, an angle, thrombus or calcium", () => {
      EVAR_CASES.forEach((c) => {
        const features = [c.neckTaperMm !== 0, c.neckAngle.deg >= 10, c.neckThrombus !== null, c.calcium.length > 0];
        expect(features.some(Boolean), c.id).toBe(true);
      });
    });

    it("narrows a conical neck between the renals and the sac", () => {
      const c = byId("small-sac");
      expect(outerRadiusMm(c, c.neckEndSlice)).toBeLessThan(outerRadiusMm(c, c.lowestRenalSlice) - 0.75);
      expect(referenceFor(c).neckDiameter).toBeCloseTo(c.neckRadiusMm * 2);
    });

    it("ends a flaring neck where it passes 110% of its diameter at the renals, before the sac bulges", () => {
      const c = byId("ectatic-left");
      const { sacStartSlice } = referenceFor(c);
      expect(sacStartSlice).toBeLessThan(c.neckEndSlice);
      expect(outerRadiusMm(c, sacStartSlice)).toBeGreaterThan(c.neckRadiusMm * 1.1);
      expect(outerRadiusMm(c, sacStartSlice - 1)).toBeLessThanOrEqual(c.neckRadiusMm * 1.1);
    });

    it("moves an angled neck sideways by tan θ a slice above the bend, and not at all below it", () => {
      const c = byId("hostile-neck");
      const perSlice = Math.tan((c.neckAngle.deg * Math.PI) / 180) * c.sliceMm;
      expect(neckOffsetMm(c, c.neckEndSlice + 6)).toBe(0);
      const middle = c.lowestRenalSlice;
      expect(neckOffsetMm(c, middle) - neckOffsetMm(c, middle + 1)).toBeCloseTo(perSlice, 1);
      expect(neckOffsetMm(c, 0)).toBe(neckOffsetMm(c, 5));
    });

    it("draws an angled neck as an oval: long by 1/cos θ along the tilt, the true diameter across it", () => {
      const c = byId("hostile-neck");
      const z = c.lowestRenalSlice + 1;
      const slice = sliceHU(c, z);
      const centre = c.centreAt(z);
      const along = edgePx(slice, c.size, centre, unit(c.neckAngle.towardDeg));
      const across = edgePx(slice, c.size, centre, unit(c.neckAngle.towardDeg - 90));
      const truePx = outerRadiusMm(c, z) / c.pixelMm;
      expect(Math.abs(across - truePx)).toBeLessThanOrEqual(1.5);
      expect(along / across).toBeCloseTo(1 / Math.cos((c.neckAngle.deg * Math.PI) / 180), 0);
      expect(along / across).toBeGreaterThan(1.35);
    });

    it("lines one side of a neck with thrombus: the lumen moves away from it, the outer wall stays round", () => {
      const c = byId("ectatic-left");
      const thrombus = c.neckThrombus!;
      const z = c.lowestRenalSlice + 2;
      const slice = sliceHU(c, z);
      const centre = c.centreAt(z);
      const toward = unit(thrombus.atDeg);
      const away = { x: -toward.x, y: -toward.y };
      const depthPx = (outerRadiusMm(c, z) - 1.5 - thrombus.thicknessMm / 2) / c.pixelMm;
      const at = (dir: { x: number; y: number }) => huAt(slice, c.size, centre.x + dir.x * depthPx, centre.y + dir.y * depthPx);
      expect(at(toward)).toBeLessThan(160);
      expect(at(away)).toBeGreaterThan(250);
      expect(Math.abs(edgePx(slice, c.size, centre, toward) - edgePx(slice, c.size, centre, away))).toBeLessThanOrEqual(1.5);
    });

    // A round neck, so the arc's degrees on the image are the same as in the vessel.
    it("puts calcified plaque in the wall where a case lists it, and not on the far side", () => {
      const c = byId("small-sac");
      const arc = c.calcium[0];
      const z = Math.round((arc.fromSlice + arc.toSlice) / 2);
      const slice = sliceHU(c, z);
      const centre = c.centreAt(z);
      const sector = (midDeg: number) =>
        range(0, Math.round(arc.spanDeg)).reduce((sum, i) => {
          const deg = midDeg - arc.spanDeg / 2 + i;
          const dir = unit(deg);
          const edge = edgePx(slice, c.size, centre, dir);
          const bright = range(1, 6).some((back) => huAt(slice, c.size, centre.x + dir.x * (edge - back), centre.y + dir.y * (edge - back)) > 450);
          return sum + (bright ? 1 : 0);
        }, 0);
      expect(sector(arc.atDeg)).toBeGreaterThan(arc.spanDeg * 0.6);
      expect(sector(arc.atDeg + 180)).toBeLessThan(arc.spanDeg * 0.25);
    });
  });

  describe("centerline", () => {
    const byId = (id: string) => EVAR_CASES.find((c) => c.id === id)!;

    it("matches the slice distance where the aorta runs straight down", () => {
      const c = byId("wide-sac");
      expect(centerlineMm(c, c.lowestRenalSlice, c.neckEndSlice)).toBeCloseTo((c.neckEndSlice - c.lowestRenalSlice) * c.sliceMm, 0);
    });

    it("is longer by about 1/cos θ through an angled neck", () => {
      const c = byId("hostile-neck");
      const from = c.lowestRenalSlice - 2;
      const to = c.neckEndSlice;
      const axial = (to - from) * c.sliceMm;
      const expected = axial / Math.cos((c.neckAngle.deg * Math.PI) / 180);
      expect(centerlineMm(c, from, to)).toBeGreaterThan(axial * 1.3);
      expect(centerlineMm(c, from, to)).toBeLessThan(expected * 1.1);
    });

    it("carries on down the chosen iliac below the bifurcation, which leans outward and so runs longer", () => {
      const c = byId("long-neck");
      const below = c.bifurcationSlice + 10;
      const axial = (below - c.bifurcationSlice) * c.sliceMm;
      expect(centerlineMm(c, c.bifurcationSlice, below, "left")).toBeGreaterThan(axial * 1.05);
      expect(centerlineMm(c, c.bifurcationSlice, below, "left")).toBeCloseTo(centerlineMm(c, c.bifurcationSlice, below, "right"), 0);
    });

    it("gives each side's distances from the lowest renal, with room to seal in every common iliac", () => {
      EVAR_CASES.forEach((c) => {
        const a = anatomyFor(c);
        expect(a.renalToBifurcation, c.id).toBeCloseTo(centerlineMm(c, c.lowestRenalSlice, c.bifurcationSlice));
        (["right", "left"] as const).forEach((side) => {
          expect(a.renalToInternalIliac[side], `${c.id} ${side}`).toBeGreaterThan(a.renalToBifurcation + 25);
          expect(c.internalIliacSlice[side], `${c.id} ${side}`).toBeLessThanOrEqual(c.slices - 4);
        });
      });
    });

    it("works out the same distances from slices you mark, and leaves out what isn't marked", () => {
      const c = byId("long-neck");
      const yours = anatomyFor(c, { renal: c.lowestRenalSlice + 1, bifurcation: c.bifurcationSlice - 1 });
      expect(yours.renalToBifurcation).toBeCloseTo(centerlineMm(c, c.lowestRenalSlice + 1, c.bifurcationSlice - 1));
      expect(yours.renalToInternalIliac.right).toBeUndefined();
    });

    it("draws each internal iliac as a second vessel splitting off below its origin", () => {
      const c = byId("long-neck");
      (["right", "left"] as const).forEach((side) => {
        const at = c.internalIliacSlice[side];
        expect(c.internalIliacCentreAt(at - 1, side), side).toBeNull();
        const internal = c.internalIliacCentreAt(at + 3, side)!;
        // Just behind the common iliac's outer wall, where only the internal iliac can put contrast.
        const common = c.iliacCentresAt(at + 3)[side];
        const commonPx = c.ciaRadiusMm[side] / c.pixelMm;
        const away = Math.hypot(internal.x - common.x, internal.y - common.y);
        const reach = commonPx + 1.5;
        const probe = { x: common.x + ((internal.x - common.x) / away) * reach, y: common.y + ((internal.y - common.y) / away) * reach };
        expect(Math.hypot(probe.x - internal.x, probe.y - internal.y), side).toBeLessThan(3.5 / c.pixelMm - 1);
        expect(huAt(sliceHU(c, at + 3), c.size, probe.x, probe.y), side).toBeGreaterThan(250);
        expect(huAt(sliceHU(c, at - 2), c.size, probe.x, probe.y), side).toBeLessThan(150);
      });
    });
  });
});
