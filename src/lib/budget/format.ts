/**
 * Money in and out of the UI. Everything internal is integer cents; these two
 * functions are the only edge where a dollar string turns into cents and back,
 * so no float arithmetic ever touches a stored amount.
 */

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/**
 * Turn a typed dollar amount into positive integer cents, or null if it isn't a
 * valid, positive money value. Tolerates a leading "$" and surrounding space.
 *
 * The conversion appends "e2" to the cleaned string rather than multiplying by
 * 100, so "1.005" parses to the exact double 100.5 and rounds to 101 cents,
 * where "1.005 * 100" would land on 100.4999... and round the wrong way.
 */
export function parseAmountToCents(input: string): number | null {
  const cleaned = input.trim().replace(/^\$/, "").trim();
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(Number(`${cleaned}e2`));
}

/** Render integer cents as a US dollar string, e.g. 1234 -> "$12.34". */
export function formatCents(cents: number): string {
  return dollars.format(cents / 100);
}
