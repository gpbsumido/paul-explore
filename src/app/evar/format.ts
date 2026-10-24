/** Millimetres to one decimal, the precision the calipers are graded at. */
export const mm = (value: number) => `${value.toFixed(1)} mm`;

/** How far off a measurement is, signed, to the same 0.1 mm. Anything that rounds to nothing is plain 0.0. */
export const offBy = (delta: number) => {
  const shown = Math.abs(delta).toFixed(1);
  if (shown === "0.0") return shown;
  return `${delta > 0 ? "+" : "-"}${shown}`;
};

/** Milliseconds as m:ss, rounding up so the clock shows 0:00 only when it's out. */
export const clock = (ms: number) => {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};
