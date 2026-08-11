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

/** Quotes a field when it contains a comma, quote or newline; doubles quotes. */
function escapeField(value: string | number): string {
  const text = String(value);
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

/**
 * Triggers a client-side download of a CSV string.
 *
 * Lives here next to `toCsv` because every caller of one wants the other, and a
 * second copy of the object-URL dance is a second place to forget the revoke.
 */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
