import { describe, it, expect } from "vitest";
import { gzipSync } from "node:zlib";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { SCAN_CASES, decodeScan, loadScan, scanSlice, type ScanCase } from "./scans";

const r6 = SCAN_CASES.find((c) => c.id === "avt-r6")!;

/** A tiny scan with the real case's encoding, so the numbers are easy to check. */
const tiny: ScanCase = { ...r6, size: 2, slices: 3 };

describe("real CTA cases", () => {
  it("ships the AVT aneurysm, with its licence and where it came from", () => {
    expect(r6.kind).toBe("scan");
    expect(r6.attribution.licence).toMatch(/CC BY 4\.0/);
    expect(r6.attribution.text).toMatch(/Radl/);
    expect(r6.attribution.links.map((l) => l.href).join(" ")).toMatch(/10\.6084\/m9\.figshare\.14806362/);
    expect(r6.attribution.links.map((l) => l.href).join(" ")).toMatch(/10\.7937\/k9\/tcia\.2015\.u1x8a5nr/i);
  });

  it("turns each stored byte back into Hounsfield units", () => {
    expect(Array.from(decodeScan(Uint8Array.from([0, 1, 100, 255]), r6))).toEqual([-160, -158, 80, 452]);
  });

  // Opening a real scan decodes about 8 million voxels on the main thread.
  // Doing it with a callback and Math.round per voxel took 383 ms here and
  // over a second on CI, long enough to time the page tests out.
  it("decodes a full-size scan fast enough not to stall the page", () => {
    const bytes = new Uint8Array(r6.size * r6.size * r6.slices).fill(100);
    decodeScan(bytes, r6);
    const started = performance.now();
    const volume = decodeScan(bytes, r6);
    expect(performance.now() - started).toBeLessThan(150);
    expect(volume[0]).toBe(80);
  });

  it("reads one slice of the volume", () => {
    const volume = Int16Array.from({ length: 12 }, (_, i) => i);
    expect(Array.from(scanSlice(volume, tiny, 1))).toEqual([4, 5, 6, 7]);
  });

  it("fetches the file and gunzips it into HU", async () => {
    server.use(http.get(tiny.file, () => new HttpResponse(gzipSync(Uint8Array.from({ length: 12 }, () => 100)))));
    const volume = await loadScan(tiny);
    expect(volume).toHaveLength(12);
    expect(volume[0]).toBe(80);
  });
});
