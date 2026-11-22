import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A value that shows for `durationMs` and then goes back to null: "Copied!",
 * a flashed row, a short toast. Showing it again restarts the clock rather
 * than letting the earlier timer cut it short, and unmounting stops the timer.
 * `clear` drops it early, for a demo's reset button.
 */
export function useTransientValue<T>(
  durationMs: number,
): [value: T | null, show: (value: T) => void, clear: () => void] {
  const [value, setValue] = useState<T | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = useCallback(
    (next: T) => {
      clearTimeout(timer.current);
      setValue(next);
      timer.current = setTimeout(() => setValue(null), durationMs);
    },
    [durationMs],
  );

  const clear = useCallback(() => {
    clearTimeout(timer.current);
    setValue(null);
  }, []);

  return [value, show, clear];
}
