/**
 * Real CTA cases, from openly licensed data, that load through the same viewer
 * as the phantoms.
 *
 * A scan has no geometry behind it, so it has no answers until someone
 * measures it by hand and saves them on the admin page. Until then it can be
 * practised on but not scored.
 *
 * Each file is made by `scripts/prepare-evar-scan.mjs`: cropped round the
 * aorta and iliacs, averaged into 2 mm slices, and stored one byte a voxel
 * over the HU range the windows show. See `public/evar/scans/ATTRIBUTION.md`.
 */

import type { EvarCase } from "./phantom";

/** Anything the practice can show: a phantom drawn from numbers, or a real scan. */
export type PracticeCase = EvarCase | ScanCase;

export type ScanCase = {
  kind: "scan";
  id: string;
  title: string;
  blurb: string;
  debrief: string;
  /** Public path of the gzipped one-byte-a-voxel volume. */
  file: string;
  size: number;
  slices: number;
  pixelMm: number;
  sliceMm: number;
  /** HU of a stored 0, and HU per step. */
  huMin: number;
  huStep: number;
  attribution: { text: string; licence: string; links: readonly { label: string; href: string }[] };
};

export const SCAN_CASES: readonly ScanCase[] = [
  {
    kind: "scan",
    id: "avt-r6",
    title: "Real CT: aneurysm with thrombus",
    blurb:
      "A real, deidentified CTA of an infrarenal aneurysm, from an openly licensed collection. Measure it the same way as the phantoms.",
    debrief:
      "This one is a person, not a phantom. The neck comes off below the renals and widens into an aneurysm with a crescent of thrombus at the back, and the common iliacs run long before the internal iliacs come off. Real anatomy doesn't line up with the slices, so the neck you mark and the diameters you take are judgement calls in a way the phantom's never were.",
    file: "/evar/scans/avt-r6.u8.gz",
    size: 256,
    slices: 127,
    pixelMm: 0.7246,
    sliceMm: 2,
    huMin: -160,
    huStep: 2.4,
    attribution: {
      text: "Case R6 from the Aortic Vessel Tree (AVT) collection, Radl et al., 2022, which builds on the RIDER Lung CT collection from The Cancer Imaging Archive. Cropped, averaged into 2 mm slices, and reduced to the HU range the viewer shows.",
      licence: "CC BY 4.0",
      links: [
        { label: "AVT on figshare", href: "https://doi.org/10.6084/m9.figshare.14806362" },
        { label: "RIDER Lung CT on TCIA", href: "https://doi.org/10.7937/K9/TCIA.2015.U1X8A5NR" },
        { label: "CC BY 4.0", href: "https://creativecommons.org/licenses/by/4.0/" },
      ],
    },
  },
];

/** Every stored byte back as Hounsfield units, to the nearest one. */
export function decodeScan(bytes: Uint8Array, c: Pick<ScanCase, "huMin" | "huStep">): Int16Array {
  return Int16Array.from(bytes, (b) => Math.round(c.huMin + b * c.huStep));
}

/** One axial slice of a decoded volume, row-major, `size * size` long. */
export function scanSlice(volume: Int16Array, c: Pick<ScanCase, "size">, z: number): Int16Array {
  const area = c.size * c.size;
  return volume.subarray(z * area, (z + 1) * area);
}

/** Fetches a scan's file, gunzips it in the browser, and decodes it to HU. */
export async function loadScan(c: ScanCase): Promise<Int16Array> {
  const res = await fetch(c.file);
  if (!res.ok || !res.body) throw new Error(`GET ${c.file} failed with ${res.status}`);
  const unzipped = res.body.pipeThrough(new DecompressionStream("gzip"));
  const bytes = new Uint8Array(await new Response(unzipped).arrayBuffer());
  return decodeScan(bytes, c);
}
