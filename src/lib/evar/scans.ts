/**
 * Real CTA cases, from openly licensed data, that load through the same viewer
 * as the phantoms.
 *
 * They're listed in a manifest that sits beside the files, so adding scans is
 * uploading files and a manifest entry, not a code change, and the files can
 * live in object storage rather than git: point NEXT_PUBLIC_EVAR_SCANS_URL at
 * wherever the manifest is. Unset, it's this site's own /evar/scans.
 *
 * A scan has no geometry behind it, so it has no answers until someone
 * measures it by hand and saves them on the admin page. Until then it can be
 * practised on but not scored.
 *
 * Each file is made by `scripts/prepare-evar-scan.mjs`: cropped round the
 * aorta and iliacs, averaged into 2 mm slices, and stored one byte a voxel
 * over the HU range the windows show. It stays one byte a voxel in memory too,
 * and a slice is turned into HU only when the viewer asks for it.
 */

import { z } from "zod";
import type { EvarCase } from "./phantom";

/** Anything the practice can show: a phantom drawn from numbers, or a real scan. */
export type PracticeCase = EvarCase | ScanCase;

export type ScanCase = {
  kind: "scan";
  id: string;
  title: string;
  blurb: string;
  debrief: string;
  /** Where the gzipped one-byte-a-voxel volume is, ready to fetch. */
  file: string;
  size: number;
  slices: number;
  pixelMm: number;
  sliceMm: number;
  /** HU of a stored 0, and HU per step. */
  huMin: number;
  huStep: number;
  attribution: {
    /** Short credit that stays on screen, like "AVT case R6". */
    source: string;
    /** The full citation, and what was changed. */
    text: string;
    licence: string;
    links: readonly { label: string; href: string }[];
  };
};

/** Case ids end up in the study API's URLs and rows, which take lowercase slugs of up to 40 characters. */
const caseId = z
  .string()
  .max(40)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "a lowercase slug");

const datasetSchema = z.object({
  /** Short name used in credits, like "AVT". */
  name: z.string().min(1),
  citation: z.string().min(1),
  licence: z.string().min(1),
  links: z.array(z.object({ label: z.string().min(1), href: z.string().url() })),
});

const scanEntrySchema = z.object({
  id: caseId,
  dataset: z.string().min(1),
  /** The case's own name in its dataset, like "R6". */
  sourceCase: z.string().min(1),
  title: z.string().min(1),
  blurb: z.string().min(1).optional(),
  debrief: z.string().min(1).optional(),
  /** Relative to the manifest's folder, or a full URL. */
  file: z.string().min(1),
  size: z.number().int().positive(),
  slices: z.number().int().positive(),
  pixelMm: z.number().positive(),
  sliceMm: z.number().positive(),
  huMin: z.number(),
  huStep: z.number().positive(),
});

const manifestSchema = z
  .object({
    version: z.literal(1),
    datasets: z.record(z.string(), datasetSchema),
    scans: z.array(scanEntrySchema),
  })
  .superRefine((manifest, ctx) => {
    const seen = new Set<string>();
    manifest.scans.forEach((scan, i) => {
      if (seen.has(scan.id)) ctx.addIssue({ code: "custom", path: ["scans", i, "id"], message: `${scan.id} is listed twice` });
      seen.add(scan.id);
      if (!(scan.dataset in manifest.datasets)) {
        ctx.addIssue({ code: "custom", path: ["scans", i, "dataset"], message: `no dataset called ${scan.dataset}` });
      }
    });
  });

const DEFAULT_BASE = "/evar/scans";

/** Where the manifest and files live, from NEXT_PUBLIC_EVAR_SCANS_URL, without a trailing slash. */
export function scansBaseUrl(raw: string | undefined): string {
  const trimmed = raw?.trim().replace(/\/+$/, "") ?? "";
  return trimmed === "" ? DEFAULT_BASE : trimmed;
}

export const SCANS_BASE_URL = scansBaseUrl(process.env.NEXT_PUBLIC_EVAR_SCANS_URL);

export const SCANS_MANIFEST_URL = `${SCANS_BASE_URL}/manifest.json`;

const isAbsolute = (url: string) => /^https?:\/\//i.test(url);

/**
 * The manifest's scans as practice cases: validated, each with its dataset's
 * licence and citation attached and its file resolved against `base`. Most of
 * hundreds of scans won't have words of their own, so they get plain ones.
 * Throws on anything malformed rather than showing half a case.
 */
export function parseManifest(json: unknown, base: string): ScanCase[] {
  const manifest = manifestSchema.parse(json);
  return manifest.scans.map((scan) => {
    const dataset = manifest.datasets[scan.dataset];
    const source = `${dataset.name} case ${scan.sourceCase}`;
    return {
      kind: "scan",
      id: scan.id,
      title: scan.title,
      blurb: scan.blurb ?? `A real, deidentified CT from ${source}. Measure it the same way as the phantoms.`,
      debrief:
        scan.debrief ??
        "This one is a person, not a phantom. Real anatomy doesn't line up with the slices, so where the neck starts and ends, and which slice shows the true widest sac, are judgement calls in a way the phantom's never were.",
      file: isAbsolute(scan.file) ? scan.file : `${base}/${scan.file}`,
      size: scan.size,
      slices: scan.slices,
      pixelMm: scan.pixelMm,
      sliceMm: scan.sliceMm,
      huMin: scan.huMin,
      huStep: scan.huStep,
      attribution: { source, text: dataset.citation, licence: dataset.licence, links: dataset.links },
    };
  });
}

/** Fetches and parses the manifest. */
export async function fetchScanCases(signal?: AbortSignal): Promise<ScanCase[]> {
  const res = await fetch(SCANS_MANIFEST_URL, { signal });
  if (!res.ok) throw new Error(`GET ${SCANS_MANIFEST_URL} failed with ${res.status}`);
  return parseManifest(await res.json(), SCANS_BASE_URL);
}

/**
 * Fetches a scan's file and gunzips it in the browser, keeping it one byte a
 * voxel. Pass the query's `signal` so moving to another case cancels a
 * download that's still going.
 */
export async function loadScan(c: ScanCase, signal?: AbortSignal): Promise<Uint8Array> {
  const res = await fetch(c.file, { signal });
  if (!res.ok || !res.body) throw new Error(`GET ${c.file} failed with ${res.status}`);
  const unzipped = res.body.pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(unzipped).arrayBuffer());
}

/** A byte only has 256 values, so its HU is a table lookup rather than arithmetic per voxel. */
const tables = new Map<string, Int16Array>();
const tableFor = (c: Pick<ScanCase, "huMin" | "huStep">) => {
  const key = `${c.huMin}:${c.huStep}`;
  const known = tables.get(key);
  if (known) return known;
  const table = Int16Array.from({ length: 256 }, (_, b) => Math.round(c.huMin + b * c.huStep));
  tables.set(key, table);
  return table;
};

/** Recent slices per loaded volume, so asking for the same one again gives back the same array. */
const SLICES_KEPT = 24;
const decoded = new WeakMap<Uint8Array, Map<number, Int16Array>>();

/**
 * One axial slice in HU, row-major, `size * size` long. The same volume and
 * slice always gives back the same array, so treat it as read-only.
 */
export function scanSlice(volume: Uint8Array, c: Pick<ScanCase, "size" | "huMin" | "huStep">, z: number): Int16Array {
  const kept = decoded.get(volume) ?? new Map<number, Int16Array>();
  decoded.set(volume, kept);
  const hit = kept.get(z);
  if (hit) {
    kept.delete(z);
    kept.set(z, hit);
    return hit;
  }
  const area = c.size * c.size;
  const bytes = volume.subarray(z * area, (z + 1) * area);
  const table = tableFor(c);
  const hu = new Int16Array(area);
  for (let i = 0; i < area; i += 1) hu[i] = table[bytes[i]];
  kept.set(z, hu);
  if (kept.size > SLICES_KEPT) kept.delete(kept.keys().next().value ?? z);
  return hu;
}
