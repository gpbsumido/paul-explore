import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

/**
 * Black-box, like the other script tests: a tiny NRRD volume and a manifest in
 * a temp folder, the real script run against them, and the files it leaves.
 */

const SCRIPT = join(process.cwd(), "scripts/prepare-evar-scan.mjs");

/** A 4 x 4 x 12 volume of soft tissue, 1 mm slices, stored raw with the Rider-style +1024 offset. */
function fixture(dir: string) {
  const voxels = new Int16Array(4 * 4 * 12).fill(1024 + 40);
  const header = [
    "NRRD0004",
    "type: short",
    "dimension: 3",
    "space: left-posterior-superior",
    "sizes: 4 4 12",
    "space directions: (0.7,0,0) (0,0.7,0) (0,0,1)",
    "endian: little",
    "encoding: raw",
    "",
    "",
  ].join("\n");
  const nrrd = join(dir, "case.nrrd");
  writeFileSync(nrrd, Buffer.concat([Buffer.from(header), Buffer.from(voxels.buffer)]));
  const manifest = join(dir, "manifest.json");
  writeFileSync(
    manifest,
    JSON.stringify({
      version: 1,
      datasets: { avt: { name: "AVT", citation: "Radl et al.", licence: "CC BY 4.0", links: [] } },
      scans: [],
    }),
  );
  return { nrrd, manifest };
}

const run = (args: string[]) => spawnSync("node", [SCRIPT, ...args], { encoding: "utf8" });

describe("prepare-evar-scan", () => {
  it("writes the volume and adds the scan to the manifest, so adding a case is one command", () => {
    const dir = mkdtempSync(join(tmpdir(), "evar-scan-"));
    const { nrrd, manifest } = fixture(dir);
    const out = join(dir, "avt-r9.u8.gz");
    const result = run([nrrd, out, "--offset", "1024", "--top", "0", "--bottom", "8", "--id", "avt-r9", "--dataset", "avt", "--case", "R9", "--title", "AVT R9"]);
    expect(result.status, result.stderr).toBe(0);

    expect(existsSync(out)).toBe(true);
    expect(gunzipSync(readFileSync(out))).toHaveLength(256 * 256 * 4);
    const written = JSON.parse(readFileSync(manifest, "utf8"));
    expect(written.scans).toEqual([
      expect.objectContaining({ id: "avt-r9", dataset: "avt", sourceCase: "R9", title: "AVT R9", file: "avt-r9.u8.gz", size: 256, slices: 4, sliceMm: 2 }),
    ]);
  });

  it("replaces a scan it's run for again rather than listing it twice", () => {
    const dir = mkdtempSync(join(tmpdir(), "evar-scan-"));
    const { nrrd, manifest } = fixture(dir);
    const out = join(dir, "avt-r9.u8.gz");
    const args = (title: string) => [nrrd, out, "--offset", "1024", "--top", "0", "--bottom", "8", "--id", "avt-r9", "--dataset", "avt", "--case", "R9", "--title", title];
    expect(run(args("First")).status).toBe(0);
    expect(run(args("Second")).status).toBe(0);
    const written = JSON.parse(readFileSync(manifest, "utf8"));
    expect(written.scans.map((s: { title: string }) => s.title)).toEqual(["Second"]);
  });

  it("keeps a scan's own words when it's processed again without them", () => {
    const dir = mkdtempSync(join(tmpdir(), "evar-scan-"));
    const { nrrd, manifest } = fixture(dir);
    const out = join(dir, "avt-r9.u8.gz");
    const base = [nrrd, out, "--offset", "1024", "--top", "0", "--bottom", "8", "--id", "avt-r9", "--dataset", "avt", "--case", "R9", "--title", "AVT R9"];
    expect(run([...base, "--blurb", "Hand-written blurb.", "--debrief", "Hand-written debrief."]).status).toBe(0);
    expect(run(base).status).toBe(0);
    const [scan] = JSON.parse(readFileSync(manifest, "utf8")).scans;
    expect(scan).toMatchObject({ blurb: "Hand-written blurb.", debrief: "Hand-written debrief." });
  });

  it("refuses a dataset the manifest doesn't describe, and leaves the manifest alone", () => {
    const dir = mkdtempSync(join(tmpdir(), "evar-scan-"));
    const { nrrd, manifest } = fixture(dir);
    const before = readFileSync(manifest, "utf8");
    const result = run([nrrd, join(dir, "x.u8.gz"), "--offset", "1024", "--top", "0", "--bottom", "8", "--id", "x-1", "--dataset", "nope", "--case", "1", "--title", "X"]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/dataset/i);
    expect(readFileSync(manifest, "utf8")).toBe(before);
  });
});
