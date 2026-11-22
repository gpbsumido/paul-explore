import { act } from "@testing-library/react";
import { vi } from "vitest";

/**
 * Moves fake timers forward inside act(), for a test where a timer firing
 * changes what React renders. Advancing them bare lets the update land outside
 * act, which logs a warning per update (62 in one ZeroProof test, where a count
 * up ticks every frame across a 31 second jump).
 */
export async function advanceTimersWithinAct(milliseconds: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
}
