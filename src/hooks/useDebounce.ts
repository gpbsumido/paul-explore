import { useState, useEffect } from "react";

/**
 * Delays updating a value until the input hasn't changed for `delay` ms.
 * Handy for search inputs — prevents firing on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
