/**
 * What every sizing sheet has in common, so the practice can grade a pick
 * from any manufacturer the same way: a catalogue, two diameter tables, and
 * the rules for how far each side reaches.
 *
 * Educational only. Not affiliated with any manufacturer and not for planning
 * a real case; each device's IFU is the source of truth.
 */

export type SheetId = "endurant" | "excluder" | "zenith-alpha";

export type Side = "right" | "left";

export type Device = {
  code: string;
  proximal: number;
  distal: number;
  lengthMm: number;
  fr: number;
};

export type DeviceGroup = { label: string; devices: readonly Device[] };

export type DevicePick = {
  sheet: SheetId;
  ipsilateral: Side;
  mainBody: string | null;
  contraLimb: string | null;
  /** A limb, leg or iliac extension on the main body's own side; null means nothing added. */
  ipsiExtension: string | null;
};

/** A span of millimetres down the centerline from the lowest renal. */
export type Reach = { min: number; max: number };

export type SheetReach = { gateMm: number | null; contra: Reach | null; ipsi: Reach | null };

export type Sheet = {
  id: SheetId;
  /** The device's name, for the picker and the results. */
  name: string;
  /** Who makes it, for the not-affiliated line. */
  maker: string;
  /** Where the tables came from. */
  source: string;
  /** Which codes are real catalogue numbers and which are built from the table's sizes. */
  codesNote: string;
  /** Every proximal diameter the table allows for a neck. Empty means no standard device. */
  mainBodyDiametersFor: (neckMm: number) => readonly number[];
  /** Every distal diameter the table allows for a common iliac. */
  limbDiametersFor: (iliacMm: number) => readonly number[];
  catalogue: {
    mainBodies: readonly DeviceGroup[];
    contraLimbs: readonly DeviceGroup[];
    ipsiExtensions: readonly DeviceGroup[];
  };
  /** The empty choice for the ipsilateral select. */
  noIpsiExtension: string;
  /** Whichever component's distal end seals the ipsilateral iliac, if any does. */
  ipsiSeal: (main: Device | null, extension: Device | null) => Device | null;
  reachFor: (pick: DevicePick) => SheetReach;
  /** Distal fixation the IFU asks for in the common iliac, in mm. */
  distalSealMm: number;
};

export type Band = { from: number; to: number; graft: number };

/**
 * Every graft whose band holds a measurement, after rounding it to `step`
 * mm the way the table is written. Bands that share an edge both count.
 */
export const lookup = (bands: readonly Band[], mm: number, step = 1): number[] => {
  const rounded = Math.round(mm / step) * step;
  return bands.filter((b) => rounded >= b.from && rounded <= b.to).map((b) => b.graft);
};

export const exactly = (mm: number): Reach => ({ min: mm, max: mm });

/** A catalogue device by its code, or null when nothing is picked. */
export const findDevice = (sheet: Pick<Sheet, "catalogue">, code: string | null): Device | null => {
  if (code === null) return null;
  const { mainBodies, contraLimbs, ipsiExtensions } = sheet.catalogue;
  return [...mainBodies, ...contraLimbs, ...ipsiExtensions].flatMap((g) => g.devices).find((d) => d.code === code) ?? null;
};
