#!/usr/bin/env node
/**
 * Turns a CTA volume from the AVT collection (an .nrrd file) into the small
 * file the EVAR practice loads: cropped around the aorta and iliacs, averaged
 * into 2 mm slices, and stored one byte a voxel over the only HU range the
 * viewer's windows show.
 *
 * The page's two windows run from -150 to 450 HU (angio) and -160 to 240
 * (soft tissue), and each maps its width onto 256 greys, so 2.4 HU a step
 * over -160 to 452 loses nothing that can be seen. Anything outside that
 * range shows as black or white in both windows anyway.
 *
 * Runs locally, not in CI: the source volumes are hundreds of MB and come
 * from figshare. Usage:
 *
 *   node scripts/prepare-evar-scan.mjs <in.nrrd> <out.u8.gz> \
 *     --offset 1024 --top 220 --bottom 560 --cx 297 --cy 250 \
 *     --id avt-r6 --dataset avt --case R6 --title "Real CT: aneurysm with thrombus"
 *
 * --offset   subtracted from stored values to get HU (1024 for the Rider scans)
 * --top/--bottom   mm down from the most superior slice to keep
 * --cx/--cy  crop centre in source pixels
 * --id --dataset --case --title   add or replace this scan in the manifest
 *            beside the output (or --manifest <path>); the dataset must already
 *            be described there, with its citation and licence.
 * --blurb --debrief   optional words for the case; it gets plain ones without.
 *
 * Then upload the .u8.gz and manifest.json to wherever
 * NEXT_PUBLIC_EVAR_SCANS_URL points (this repo's public/evar/scans by default).
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const SIZE = 256;
const SLICE_MM = 2;
const HU_MIN = -160;
const HU_STEP = 2.4;

function readNrrd(path) {
  const buf = fs.readFileSync(path);
  const sep = buf.indexOf("\n\n");
  const header = Object.fromEntries(
    buf
      .subarray(0, sep)
      .toString()
      .split("\n")
      .map((line) => line.match(/^([^:#]+):=?\s*(.*)$/))
      .filter(Boolean)
      .map((m) => [m[1].trim(), m[2].trim()]),
  );
  const raw = /gz/.test(header.encoding) ? zlib.gunzipSync(buf.subarray(sep + 2)) : buf.subarray(sep + 2);
  const sizes = header.sizes.split(/\s+/).map(Number);
  const dirs = [...header["space directions"].matchAll(/\(([^)]+)\)/g)].map((m) => m[1].split(",").map(Number));
  const types = { short: Int16Array, int16: Int16Array, int: Int32Array, "signed short": Int16Array };
  const Type = types[header.type];
  if (!Type) throw new Error(`Unsupported NRRD type ${header.type}`);
  const data = new Type(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
  return { sizes, spacing: dirs.map((d) => Math.hypot(...d)), superiorUp: dirs[2][2] > 0, data };
}

const args = process.argv.slice(2);
const [input, output] = args;
const text = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
const flag = (name, fallback) => {
  const value = text(name);
  return value === undefined ? fallback : Number(value);
};
const fail = (message) => {
  console.error(message);
  process.exit(1);
};
if (!input || !output) {
  fail("Usage: prepare-evar-scan.mjs <in.nrrd> <out.u8.gz> --offset N --top MM --bottom MM --cx PX --cy PX [--id ID --dataset KEY --case NAME --title TITLE]");
}

// Checked before any work, so a bad entry doesn't cost a long run or touch the manifest.
const id = text("id");
const manifestPath = text("manifest") ?? path.join(path.dirname(output), "manifest.json");
let manifest = null;
if (id !== undefined) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id.length > 40) fail(`--id must be a lowercase slug of up to 40 characters, not "${id}"`);
  for (const required of ["dataset", "case", "title"]) if (!text(required)) fail(`--${required} is needed with --id`);
  if (!fs.existsSync(manifestPath)) fail(`No manifest at ${manifestPath}; create one with the dataset first`);
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!(text("dataset") in (manifest.datasets ?? {}))) fail(`The manifest has no dataset called "${text("dataset")}"; add its citation and licence first`);
}

const v = readNrrd(input);
const [w, h, d] = v.sizes;
const [px, , sz] = v.spacing;
const offset = flag("offset", 0);
const top = flag("top", 0);
const bottom = flag("bottom", d * sz);
const cx = Math.round(flag("cx", w / 2));
const cy = Math.round(flag("cy", h / 2));
const x0 = cx - SIZE / 2;
const y0 = cy - SIZE / 2;

/** Source slice index for a depth in mm below the most superior slice. */
const sourceAt = (mm) => (v.superiorUp ? d - 1 - mm / sz : mm / sz);

const slices = Math.floor((bottom - top) / SLICE_MM);
const out = new Uint8Array(SIZE * SIZE * slices);
for (let s = 0; s < slices; s += 1) {
  const from = top + s * SLICE_MM;
  const indices = [];
  for (let mm = from; mm < from + SLICE_MM; mm += sz) indices.push(Math.round(sourceAt(mm)));
  const valid = [...new Set(indices)].filter((z) => z >= 0 && z < d);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const sx = x0 + x;
      const sy = y0 + y;
      let hu = -1000;
      if (sx >= 0 && sx < w && sy >= 0 && sy < h && valid.length > 0) {
        hu = valid.reduce((sum, z) => sum + v.data[z * w * h + sy * w + sx] - offset, 0) / valid.length;
      }
      out[(s * SIZE + y) * SIZE + x] = Math.max(0, Math.min(255, Math.round((hu - HU_MIN) / HU_STEP)));
    }
  }
}

const gz = zlib.gzipSync(out, { level: 9 });
fs.writeFileSync(output, gz);
const geometry = { size: SIZE, slices, pixelMm: Number(px.toFixed(4)), sliceMm: SLICE_MM, huMin: HU_MIN, huStep: HU_STEP };

if (manifest) {
  // Running it again for the same id replaces that entry in place, rather than listing it twice,
  // and keeps any words written for it unless new ones are given.
  const at = manifest.scans.findIndex((scan) => scan.id === id);
  const previous = at === -1 ? {} : manifest.scans[at];
  const blurb = text("blurb") ?? previous.blurb;
  const debrief = text("debrief") ?? previous.debrief;
  const entry = {
    id,
    dataset: text("dataset"),
    sourceCase: text("case"),
    title: text("title"),
    ...(blurb ? { blurb } : {}),
    ...(debrief ? { debrief } : {}),
    file: path.basename(output),
    ...geometry,
  };
  manifest.scans = at === -1 ? [...manifest.scans, entry] : manifest.scans.map((scan, i) => (i === at ? entry : scan));
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log(JSON.stringify({ ...geometry, bytes: gz.length, manifest: manifest ? manifestPath : null }, null, 2));
