import { describe, it, expect } from "vitest";
import { gzipSync } from "node:zlib";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import manifest from "../../../public/evar/scans/manifest.json";
import { loadScan, parseManifest, scanSlice, scansBaseUrl, type ScanCase } from "./scans";

const [r6] = parseManifest(manifest, "/evar/scans");

/** A tiny scan with the real case's encoding, so the numbers are easy to check. */
const tiny: ScanCase = { ...r6, id: "tiny-scan", file: "/evar/scans/tiny.u8.gz", size: 2, slices: 3 };

describe("the scan manifest", () => {
  it("lists the AVT aneurysm, with its dataset's licence and citation attached", () => {
    expect(r6).toMatchObject({ kind: "scan", id: "avt-r6", file: "/evar/scans/avt-r6.u8.gz", size: 256, slices: 127 });
    expect(r6.attribution.licence).toMatch(/CC BY 4\.0/);
    expect(r6.attribution.source).toBe("AVT case R6");
    expect(r6.attribution.text).toMatch(/Radl/);
    expect(r6.attribution.links.map((l) => l.href).join(" ")).toMatch(/10\.6084\/m9\.figshare\.14806362/);
  });

  it("serves files from wherever the scans live, a CDN as easily as this site", () => {
    const [remote] = parseManifest(manifest, "https://scans.example.com/evar");
    expect(remote.file).toBe("https://scans.example.com/evar/avt-r6.u8.gz");
  });

  it("gives a scan with no words of its own a plain blurb and debrief, since hundreds won't have them", () => {
    const bare = { ...manifest, scans: [{ ...manifest.scans[0], id: "avt-r7", sourceCase: "R7", title: "AVT R7", blurb: undefined, debrief: undefined }] };
    const [scan] = parseManifest(bare, "/evar/scans");
    expect(scan.blurb).toMatch(/real, deidentified CT/i);
    expect(scan.debrief.length).toBeGreaterThan(40);
  });

  it("refuses a manifest whose scan names a dataset it doesn't describe, or an id the API won't take", () => {
    expect(() => parseManifest({ ...manifest, scans: [{ ...manifest.scans[0], dataset: "nope" }] }, "/evar/scans")).toThrow();
    expect(() => parseManifest({ ...manifest, scans: [{ ...manifest.scans[0], id: "Not A Slug" }] }, "/evar/scans")).toThrow();
    expect(() => parseManifest({ ...manifest, scans: [manifest.scans[0], manifest.scans[0]] }, "/evar/scans")).toThrow();
  });
});

describe("scansBaseUrl", () => {
  it("defaults to this site's own folder and drops a trailing slash", () => {
    expect(scansBaseUrl(undefined)).toBe("/evar/scans");
    expect(scansBaseUrl("")).toBe("/evar/scans");
    expect(scansBaseUrl("https://scans.example.com/evar/")).toBe("https://scans.example.com/evar");
  });
});

describe("loading a scan", () => {
  it("keeps the volume at one byte a voxel and decodes a slice to HU only when it's asked for", async () => {
    server.use(http.get(tiny.file, () => new HttpResponse(gzipSync(Uint8Array.from({ length: 12 }, (_, i) => (i < 4 ? 0 : 100))))));
    const volume = await loadScan(tiny);
    expect(volume).toBeInstanceOf(Uint8Array);
    expect(volume).toHaveLength(12);
    expect(Array.from(scanSlice(volume, tiny, 0))).toEqual([-160, -160, -160, -160]);
    expect(Array.from(scanSlice(volume, tiny, 1))).toEqual([80, 80, 80, 80]);
  });

  it("hands back the same slice array when asked twice, so the viewer doesn't redraw it", async () => {
    server.use(http.get(tiny.file, () => new HttpResponse(gzipSync(new Uint8Array(12)))));
    const volume = await loadScan(tiny);
    expect(scanSlice(volume, tiny, 2)).toBe(scanSlice(volume, tiny, 2));
  });

  it("gives up when its download is cancelled, so switching cases doesn't keep fetching", async () => {
    server.use(http.get(tiny.file, () => new HttpResponse(gzipSync(new Uint8Array(12)))));
    const controller = new AbortController();
    controller.abort();
    await expect(loadScan(tiny, controller.signal)).rejects.toThrow();
  });

  it("fails loudly when the file isn't there", async () => {
    server.use(http.get(tiny.file, () => new HttpResponse(null, { status: 404 })));
    await expect(loadScan(tiny)).rejects.toThrow(/404/);
  });
});
