import { describe, it, expect } from "vitest";
import { loadInitialScans } from "./initialScans";

describe("loadInitialScans", () => {
  it("reads this site's own manifest on the server, so the first render already has the real scans", async () => {
    const scans = await loadInitialScans();
    expect(scans.map((s) => s.id)).toContain("avt-r6");
    expect(scans[0].file).toBe("/evar/scans/avt-r6.u8.gz");
  });
});
