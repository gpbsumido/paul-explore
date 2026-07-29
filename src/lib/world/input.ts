import type { MoveInput } from "@/types/world";

const FORWARD_KEYS = ["KeyW", "ArrowUp"] as const;
const BACKWARD_KEYS = ["KeyS", "ArrowDown"] as const;
const LEFT_KEYS = ["KeyA", "ArrowLeft"] as const;
const RIGHT_KEYS = ["KeyD", "ArrowRight"] as const;
const RUN_KEYS = ["ShiftLeft", "ShiftRight"] as const;

const anyPressed = (keys: ReadonlySet<string>, codes: readonly string[]) =>
  codes.some((code) => keys.has(code));

/**
 * Turns the currently pressed key codes into a camera-space move intent.
 * Opposing keys cancel, diagonals are normalized to unit length, and shift
 * flags running. Pure — safe to call every frame.
 */
export function directionFromKeys(keys: ReadonlySet<string>): MoveInput {
  const x = (anyPressed(keys, RIGHT_KEYS) ? 1 : 0) - (anyPressed(keys, LEFT_KEYS) ? 1 : 0);
  const z = (anyPressed(keys, BACKWARD_KEYS) ? 1 : 0) - (anyPressed(keys, FORWARD_KEYS) ? 1 : 0);
  const length = Math.hypot(x, z);
  const running = anyPressed(keys, RUN_KEYS);

  if (length === 0) return { x: 0, z: 0, running };
  return { x: x / length, z: z / length, running };
}
