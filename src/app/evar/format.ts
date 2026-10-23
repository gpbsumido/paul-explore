/** Millimetres to one decimal, the precision the calipers are graded at. */
export const mm = (value: number) => `${value.toFixed(1)} mm`;

/** Milliseconds as m:ss, rounding up so the clock shows 0:00 only when it's out. */
export const clock = (ms: number) => {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};
