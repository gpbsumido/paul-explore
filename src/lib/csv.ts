// ---------------------------------------------------------------------------
// CSV serialization, RFC 4180: fields containing a comma, quote or newline are
// wrapped in double quotes, and quotes inside them are doubled. Small and pure,
// so the escaping is tested rather than trusted — the failure mode of a naive
// join is a comma in a product name silently shifting every column after it.
// ---------------------------------------------------------------------------

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number;
};

/**
 * Characters that make a spreadsheet treat a cell as code rather than text.
 * Tab and carriage return are in here because Excel skips leading whitespace
 * and then reads what follows, so "\t=1+1" runs just as "=1+1" does.
 */
const FORMULA_LEAD = /^[=+\-@\t\r]/;

/**
 * Neutralises a cell that a spreadsheet would execute.
 *
 * A field opening with = + - @ is run as a formula by Excel and Sheets, so an
 * export of text somebody else typed becomes a way to run something on the
 * machine of whoever opens it. RFC 4180 quoting is not a defence: the quotes
 * are stripped at parse time and the formula runs anyway.
 *
 * A leading apostrophe is the standard fix -- it forces the cell to text, and
 * spreadsheets do not display it. Only strings are considered: a negative
 * number is data, and prefixing it would corrupt every negative figure in a
 * finance export, which is worse than the problem being solved.
 *
 * No library is used here on purpose. The popular CSV writers do not escape
 * these characters by default either, so adding one would grow the bundle
 * without addressing this.
 */
function defuseFormula(value: string | number): string {
  if (typeof value === "number") return String(value);
  return FORMULA_LEAD.test(value) ? `'${value}` : value;
}

/**
 * Quotes a field when it contains a comma, quote or newline; doubles quotes.
 * Runs after the formula guard, so a field needing both gets the apostrophe
 * inside the quotes where a parser will keep it.
 */
function escapeField(value: string | number): string {
  const text = defuseFormula(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Serialises rows to a CSV string with a header line. Rows are separated by
 * CRLF per the spec; the header is always present, so an empty export is a file
 * with column names rather than an empty one.
 */
export function toCsv<T>(
  rows: readonly T[],
  columns: readonly CsvColumn<T>[],
): string {
  const header = columns.map((c) => escapeField(c.header)).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => escapeField(c.value(row))).join(","),
  );
  return [header, ...lines].join("\r\n");
}
