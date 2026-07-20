/**
 * Cycle the selected feature index. From the intro state (null), stepping
 * forward lands on the first feature and stepping back lands on the last.
 * At either end the selection wraps around.
 */
export function cycleIndex(
  current: number | null,
  step: 1 | -1,
  length: number,
): number {
  if (current === null) return step === 1 ? 0 : length - 1;
  return (current + step + length) % length;
}
