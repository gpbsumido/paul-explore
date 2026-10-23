import { describe, it, expect } from "vitest";
import { makeAttempt, makeParticipant, makeStudyExport } from "@/test/factories/evar";
import { studyExportSchema, toCsv, toStudyRows } from "./studyExport";

describe("studyExportSchema", () => {
  it("reads what the API sends", () => {
    const parsed = studyExportSchema.parse(makeStudyExport());
    expect(parsed.attempts[0].scores).toHaveLength(5);
  });

  it("accepts an attempt with no devices picked", () => {
    expect(() => studyExportSchema.parse(makeStudyExport({ attempts: [makeAttempt({ devices: null })] }))).not.toThrow();
  });
});

describe("toStudyRows", () => {
  it("puts each attempt next to its participant's training profile", () => {
    const [row] = toStudyRows(makeStudyExport({ participants: [makeParticipant({ trainingLevel: "fellow", specialty: "Vascular" })] }));
    expect(row).toMatchObject({ trainingLevel: "fellow", specialty: "Vascular", caseId: "long-neck", level: "medium" });
  });

  it("leaves the profile empty for an attempt whose participant isn't in the export", () => {
    const [row] = toStudyRows(makeStudyExport({ participants: [] }));
    expect(row.trainingLevel).toBeNull();
  });
});

describe("toCsv", () => {
  it("writes a header and one line per attempt, measurements and devices as columns", () => {
    const [header, line, ...rest] = toCsv(toStudyRows(makeStudyExport())).trimEnd().split("\n");
    expect(rest).toHaveLength(0);
    const columns = header.split(",");
    const values = line.split(",");
    const cell = (name: string) => values[columns.indexOf(name)];
    expect(cell("participant_id")).toBe("11111111-1111-4111-8111-111111111111");
    expect(cell("training_level")).toBe("resident");
    expect(cell("neckLength_yours")).toBe("36");
    expect(cell("neckLength_reference")).toBe("30");
    expect(cell("neckLength_verdict")).toBe("outside");
    expect(cell("mainBody_code")).toBe("ETBF2816C145EE");
    expect(cell("contralateral_verdict")).toBe("unpicked");
    expect(cell("contralateral_picked")).toBe("");
    expect(cell("timed_out")).toBe("false");
  });

  it("quotes cells with commas, quotes or line breaks", () => {
    const csv = toCsv(toStudyRows(makeStudyExport({ participants: [makeParticipant({ specialty: 'Vascular, "IR"\nmostly' })] })));
    expect(csv).toContain('"Vascular, ""IR""\nmostly"');
  });

  it("is just the header when there's nothing to export", () => {
    expect(toCsv([]).trimEnd().split("\n")).toHaveLength(1);
  });
});
