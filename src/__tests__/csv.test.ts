import { describe, it, expect } from "vitest";
import { toCsv } from "@/lib/csv";

type Row = { name: string; qty: number };

const COLUMNS = [
  { header: "Name", value: (r: Row) => r.name },
  { header: "Qty", value: (r: Row) => r.qty },
] as const;

describe("toCsv", () => {
  it("writes a header row and one line per row", () => {
    const csv = toCsv([{ name: "Cola", qty: 3 }], COLUMNS);
    expect(csv).toBe("Name,Qty\r\nCola,3");
  });

  it("returns just the header for no rows", () => {
    expect(toCsv([], COLUMNS)).toBe("Name,Qty");
  });

  it("quotes a field that contains a comma", () => {
    const csv = toCsv([{ name: "Nuts, Mixed", qty: 1 }], COLUMNS);
    expect(csv).toBe('Name,Qty\r\n"Nuts, Mixed",1');
  });

  it("doubles quotes inside a quoted field", () => {
    const csv = toCsv([{ name: 'The "Big" One', qty: 2 }], COLUMNS);
    expect(csv).toBe('Name,Qty\r\n"The ""Big"" One",2');
  });

  it("quotes a field that contains a newline", () => {
    const csv = toCsv([{ name: "line1\nline2", qty: 1 }], COLUMNS);
    expect(csv).toBe('Name,Qty\r\n"line1\nline2",1');
  });
});

// ---------------------------------------------------------------------------
// Formula injection. A cell opening with = + - @ is run as a formula by Excel
// and Sheets, so an export of names somebody else typed is a way to execute
// something on the machine of whoever opens the file. RFC 4180 has nothing to
// say about this -- quoting is not the defence, because a quoted cell is still
// parsed as a formula once the quotes come off.
// ---------------------------------------------------------------------------

describe("toCsv formula injection", () => {
  it("defuses a cell that would run as a formula", () => {
    const csv = toCsv([{ name: "=1+1", qty: 1 }], COLUMNS);
    expect(csv).toBe("Name,Qty\r\n'=1+1,1");
  });

  it("defuses the whole set of leading characters spreadsheets treat as code", () => {
    for (const lead of ["=", "+", "-", "@"]) {
      const csv = toCsv([{ name: `${lead}HYPERLINK("http://x")`, qty: 1 }], COLUMNS);
      expect(csv).toContain(`'${lead}HYPERLINK`);
    }
  });

  it("defuses a leading tab or carriage return, which Excel also treats as a lead-in", () => {
    expect(toCsv([{ name: "\t=1+1", qty: 1 }], COLUMNS)).toContain("'\t=1+1");
    expect(toCsv([{ name: "\r=1+1", qty: 1 }], COLUMNS)).toContain("'\r=1+1");
  });

  it("still quotes a dangerous field that also needs RFC 4180 quoting", () => {
    // Both rules have to apply, and the prefix goes inside the quotes.
    const csv = toCsv([{ name: '=cmd|"/c calc"!A1', qty: 1 }], COLUMNS);
    expect(csv).toBe('Name,Qty\r\n"\'=cmd|""/c calc""!A1",1');
  });

  it("leaves an ordinary field completely alone", () => {
    const csv = toCsv(
      [
        { name: "Cola", qty: 3 },
        { name: "7 Up", qty: 1 },
        { name: "Salt & Vinegar", qty: 2 },
      ],
      COLUMNS,
    );
    expect(csv).toBe("Name,Qty\r\nCola,3\r\n7 Up,1\r\nSalt & Vinegar,2");
  });

  it("does not mangle a negative number, which is not a formula", () => {
    // -5 as a number is data. Prefixing it would corrupt every negative figure
    // in a finance export, which is worse than the thing being defended against.
    const csv = toCsv([{ name: "Refund", qty: -5 }], COLUMNS);
    expect(csv).toBe("Name,Qty\r\nRefund,-5");
  });
});
