/**
 * Turns a React Query error state into a display string. Returns the error's
 * own message when it's a real Error, the fallback when it's some other thrown
 * value, and null when the query isn't in an error state at all. Every read
 * hook repeated this exact ternary, so it lives here once.
 */
export function queryErrorMessage(
  isError: boolean,
  error: unknown,
  fallback: string,
): string | null {
  if (!isError) return null;
  return error instanceof Error ? error.message : fallback;
}
