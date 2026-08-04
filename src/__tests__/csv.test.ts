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
