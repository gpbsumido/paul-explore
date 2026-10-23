import { describe, it, expect } from "vitest";
import manifest from "../../../public/evar/scans/manifest.json";
import { caseTitle } from "./caseCatalogue";
import { parseManifest } from "./scans";

const scans = parseManifest(manifest, "/evar/scans");

describe("caseTitle", () => {
  it("names phantoms and real scans alike, and falls back to the id for anything it doesn't know", () => {
    expect(caseTitle("hostile-neck", scans)).toBe("Hostile neck");
    expect(caseTitle("avt-r6", scans)).toBe(scans[0].title);
    expect(caseTitle("avt-r6", [])).toBe("avt-r6");
  });
});
