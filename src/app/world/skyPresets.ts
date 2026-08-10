import type { TimeOfDay } from "@/lib/world/daylight";

// One lighting grade per time of day. Everything the scene needs to dress the
// city for the visitor's local clock lives here, so the components just look
// values up instead of branching.

export type SkyPreset = {
  readonly background: string;
  readonly fog: readonly [color: string, near: number, far: number];
  readonly hemisphere: readonly [
    sky: string,
    ground: number | string,
    intensity: number,
  ];
  readonly sun: {
    readonly color: string;
    readonly intensity: number;
    readonly position: readonly [number, number, number];
  };
  readonly ambient: { readonly color: string; readonly intensity: number };
  // Emissive strength of the lit-window texture on towers.
  readonly windowGlow: number;
  readonly showStars: boolean;
  readonly showMoon: boolean;
  // The visible sun disc; null when it isn't in the sky.
  readonly sunDisc: {
    readonly color: string;
    readonly position: readonly [number, number, number];
    readonly radius: number;
  } | null;
  readonly lampsOn: boolean;
  readonly lantern: number;
  readonly lake: string;
  readonly lakeGlint: string;
  readonly ground: string;
  readonly road: string;
  readonly park: string;
};

export const SKY_PRESETS: Record<TimeOfDay, SkyPreset> = {
  night: {
    background: "#0b101d",
    fog: ["#0b101d", 70, 160],
    hemisphere: ["#41577f", "#1a2030", 1.5],
    sun: { color: "#a9c2ec", intensity: 1.4, position: [40, 60, -30] },
    ambient: { color: "#66779e", intensity: 0.55 },
    windowGlow: 0.85,
    showStars: true,
    showMoon: true,
    sunDisc: null,
    lampsOn: true,
    lantern: 14,
    lake: "#10233d",
    lakeGlint: "#b9d4ff",
    ground: "#1d2434",
    road: "#2b3245",
    park: "#1e3627",
  },
  dusk: {
    background: "#37294a",
    fog: ["#402e50", 75, 165],
    hemisphere: ["#a06a8e", "#2c2438", 1.4],
    sun: { color: "#ffab5e", intensity: 1.9, position: [-70, 18, 10] },
    ambient: { color: "#8a6f96", intensity: 0.55 },
    windowGlow: 0.55,
    showStars: false,
    showMoon: false,
    sunDisc: { color: "#ffb168", position: [-150, 20, -10], radius: 10 },
    lampsOn: true,
    lantern: 8,
    lake: "#2a2f55",
    lakeGlint: "#ffc48a",
    ground: "#2a2740",
    road: "#3a3652",
    park: "#28402f",
  },
  day: {
    background: "#8fc3ea",
    fog: ["#a6cde9", 90, 200],
    hemisphere: ["#cfe4f8", "#7a8696", 1.6],
    sun: { color: "#fff3da", intensity: 2.4, position: [50, 80, -20] },
    ambient: { color: "#dcebfa", intensity: 0.75 },
    windowGlow: 0.06,
    showStars: false,
    showMoon: false,
    sunDisc: { color: "#fff8e0", position: [90, 110, -140], radius: 8 },
    lampsOn: false,
    lantern: 0,
    lake: "#2e6a9e",
    lakeGlint: "#e8f4ff",
    ground: "#8a8f9a",
    road: "#6a707e",
    park: "#4a8557",
  },
};
