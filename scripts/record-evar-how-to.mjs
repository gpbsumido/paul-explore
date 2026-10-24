#!/usr/bin/env node
// Records the how-to-measure video, and the guide's pictures, from the real practice page.
//
// It measures the long straight neck on Medium the way the guide says to,
// with labels drawn on the scan where each measurement goes. Captions come
// from src/lib/evar/howToScenes.ts, which the welcome page and the guide both
// write out as the transcript. Along the way it saves a WebP still of each step
// into public/evar/guide/, the pictures the guide shows beside its text.
//
//   node scripts/record-evar-how-to.mjs [base url]      (default http://localhost:3000)
//   swift scripts/encode-frames.swift <frames>/frames.txt public/evar/welcome/how-to-measure.mp4 30 900000
//
// The page renders at 1280 by 848, at twice the pixels so the stills are
// sharp, and the video shows the 1280 by 640 under the headers: the panel, the
// scan and the dock. poster.png, in the same folder as the frames, is the neck
// with its calipers and labels, for the video's poster.
//
// Needs a running server. macOS only for the encode, since it uses AVFoundation.

import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FPS, endurantPick, openRecorder, scanTools } from "./evar-video.mjs";

const { HOW_TO_SCENES } = await import("../src/lib/evar/howToScenes.ts");
const { EVAR_CASES, outerRadiusMm, referenceFor } = await import("../src/lib/evar/phantom.ts");

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = join(tmpdir(), "evar-how-to-frames");
const STILLS = "public/evar/guide";
const VIEWPORT = { width: 1280, height: 848 };
/** Below the site and practice headers: the panel, the scan and the dock. */
const STAGE = { x: 0, y: 196, width: 1280, height: 640 };
/** The scan pictures are square, and a little smaller than the scan's own pixels. */
const SCAN_STILL = { width: 920, height: 920 };

mkdirSync(STILLS, { recursive: true });
const rec = await openRecorder({
  base: BASE,
  out: OUT,
  scenes: HOW_TO_SCENES,
  viewport: VIEWPORT,
  deviceScaleFactor: 2,
  storage: { "evar-welcomed": "true" },
});
const { page, compositor, caption, frame, framesUsed, moveCamera, dress, say, card, clickOn, holdUntil } = rec;

const noteStyle = `
  #howto-notes { position: fixed; inset: 0; pointer-events: none; z-index: 2147483645; }
  #howto-notes svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  .howto-note { position: absolute; transform: translate(-50%, -50%); padding: 5px 11px; border-radius: 8px;
    background: rgba(10, 10, 12, 0.86); border: 1.5px solid #facc15; color: #fff; white-space: nowrap;
    font: 600 18px/1.25 ui-sans-serif, system-ui, sans-serif; }`;

/** Labels points on the page the way a figure is annotated: a dot on each, and a line out to one label at `at`. */
async function note(text, points, at) {
  await page.evaluate(
    ([label, targets, box]) => {
      const ns = "http://www.w3.org/2000/svg";
      let layer = document.getElementById("howto-notes");
      if (!layer) {
        layer = document.createElement("div");
        layer.id = "howto-notes";
        layer.append(document.createElementNS(ns, "svg"));
        document.body.append(layer);
      }
      const svg = layer.querySelector("svg");
      const draw = (name, attrs) => {
        const el = document.createElementNS(ns, name);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
        svg.append(el);
      };
      for (const p of targets) {
        draw("line", { x1: p.x, y1: p.y, x2: box.x, y2: box.y, stroke: "#facc15", "stroke-width": 2 });
        draw("circle", { cx: p.x, cy: p.y, r: 3.5, fill: "#facc15" });
      }
      const el = document.createElement("div");
      el.className = "howto-note";
      el.textContent = label;
      Object.assign(el.style, { left: `${box.x}px`, top: `${box.y}px` });
      layer.append(el);
    },
    [text, points, at],
  );
}

const clearNotes = () => page.evaluate(() => document.getElementById("howto-notes")?.remove());

/** Saves part of the page as a WebP for the guide, at `size` pixels, or at the page's own when it's left out. */
async function still(name, clip, size = { width: Math.round(clip.width * 2), height: Math.round(clip.height * 2) }) {
  // No drawn cursor, and the real one parked off the scan so the viewer's crosshair goes too.
  const cursor = page.locator("#intro-cursor");
  await page.mouse.move(VIEWPORT.width - 40, 400);
  await cursor.evaluate((el) => (el.style.visibility = "hidden"));
  const png = await page.screenshot({ clip });
  await cursor.evaluate((el) => (el.style.visibility = "visible"));
  const webp = await compositor.evaluate(
    async ([b64, width, height]) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const canvas = Object.assign(document.createElement("canvas"), { width, height });
      const g = canvas.getContext("2d");
      g.imageSmoothingQuality = "high";
      g.drawImage(img, 0, 0, width, height);
      return canvas.toDataURL("image/webp", 0.8);
    },
    [png.toString("base64"), size.width, size.height],
  );
  if (!webp.startsWith("data:image/webp;")) throw new Error("this Chromium can't write WebP");
  const file = join(STILLS, `${name}.webp`);
  writeFileSync(file, Buffer.from(webp.split(",")[1], "base64"));
  console.log(`${file}: ${size.width} by ${size.height}`);
}

/**
 * Saves a strip of the panel, from the top of `from` to the bottom of `to`.
 * The panel scrolls itself, so it's scrolled to put `from` just under the
 * tabs for the picture, then put back so the video doesn't jump.
 */
async function panelStill(name, from, to) {
  const panel = page.locator("#evar-measurements");
  const box = await panel.boundingBox();
  const was = await panel.evaluate((el) => el.scrollTop);
  const tabs = await page.getByRole("tablist", { name: "Task" }).boundingBox();
  const under = tabs.y + tabs.height + 12;
  await panel.evaluate((el, by) => el.scrollBy(0, by), (await from.boundingBox()).y - under);
  const top = (await from.boundingBox()).y - 12;
  const bottom = Math.min((await to.boundingBox()).y + (await to.boundingBox()).height + 12, box.y + box.height);
  await still(name, { x: box.x - 4, y: top, width: box.width + 8, height: bottom - top });
  await panel.evaluate((el, at) => el.scrollTo(0, at), was);
}

// The long straight neck on Medium: the case the guide works through, graded the way the captions say.
const evarCase = EVAR_CASES[0];
const reference = referenceFor(evarCase);
const px = (mm) => mm / evarCase.pixelMm;
const record = (label) => page.getByRole("button", { name: new RegExp(`record caliper as ${label}`, "i") });

await page.goto(`${BASE}/evar`, { waitUntil: "networkidle" });
await page.getByRole("radio", { name: evarCase.title }).check({ force: true });
await page.waitForTimeout(300);
const level = await page.locator('input[name="evar-level"]:checked').getAttribute("value");
if (level !== "medium") throw new Error(`the practice opened on ${level}, not medium`);
await dress();
await page.addStyleTag({ content: noteStyle });
await moveCamera(STAGE);
const scan = scanTools(rec, evarCase);
/** Labels image points on the scan, with the label `offset` screen pixels from the first of them. */
async function label(text, points, offset) {
  const at = await Promise.all(points.map((p) => scan.onScreen(p)));
  await note(text, at, { x: at[0].x + offset.x, y: at[0].y + offset.y });
}

let start = framesUsed();
await card(caption.title.replace(/\.$/, ""), "EVAR Sizing");
say("");
await holdUntil(start, "title");

// Zoom in and scroll down to the lowest renal artery.
const renal = evarCase.lowestRenalSlice;
const aorta = evarCase.centreAt(renal);
const aortaR = px(outerRadiusMm(evarCase, renal));
start = framesUsed();
await card(null, null);
say(caption.renal);
await frame(12);
await scan.zoomIn();
await scan.zoomIn();
await scan.slider.focus();
for (let z = Number(await scan.slider.inputValue()) + 1; z <= renal; z += 1) {
  await page.keyboard.press("ArrowRight");
  await frame(4);
}
await label("Aorta", [{ x: aorta.x + aortaR * 0.4, y: aorta.y - aortaR * 0.4 }], { x: 40, y: -120 });
await label("Lowest renal artery", [{ x: aorta.x - aortaR - 12, y: aorta.y }], { x: -40, y: -110 });
await frame(10);
const surfaceBox = await scan.surface.boundingBox();
await still("neck-start", surfaceBox, SCAN_STILL);
await holdUntil(start, "renal");

// Calipers across the neck at its outer wall, two slices down, where the renal artery's last glow has gone.
const neckSlice = renal + 2;
const neck = evarCase.centreAt(neckSlice);
const neckR = outerRadiusMm(evarCase, neckSlice);
start = framesUsed();
await clearNotes();
say(caption.diameter);
for (let z = renal + 1; z <= neckSlice; z += 1) {
  await page.keyboard.press("ArrowRight");
  await frame(5);
}
const neckEnds = await scan.caliper(neck, neckR, 6);
await note("Outer wall to outer wall", neckEnds, { x: (neckEnds[0].x + neckEnds[1].x) / 2, y: neckEnds[0].y + 110 });
await frame(FPS);
await clickOn(record("proximal neck diameter"), 6);
await holdUntil(start, "diameter");

// The calcium in the front of the neck's wall, inside the outer edge.
start = framesUsed();
say(caption.wall);
const [arc] = evarCase.calcium;
const toward = { x: Math.cos((arc.atDeg * Math.PI) / 180), y: -Math.sin((arc.atDeg * Math.PI) / 180) };
const inWall = px(neckR) - 1.4;
await label("Calcium, inside the wall", [{ x: neck.x + toward.x * inWall, y: neck.y + toward.y * inWall }], { x: -150, y: -95 });
await frame(FPS);
await still("neck-diameter", surfaceBox, SCAN_STILL);
copyFileSync(await frame(1), join(OUT, "poster.png"));
await holdUntil(start, "wall");

// Mark the lowest renal, then scroll to where the aorta first widens by more than 10%.
const sacStart = reference.sacStartSlice;
const widening = evarCase.centreAt(sacStart);
start = framesUsed();
await clearNotes();
say(caption.length);
await scan.toSlice(renal);
await clickOn(page.getByRole("button", { name: /mark this slice as lowest renal artery/i }), 6);
await scan.slider.focus();
for (let z = renal + 1; z <= sacStart; z += 1) {
  await page.keyboard.press("ArrowRight");
  await frame(3);
}
await label("More than 10% wider than the neck", [{ x: widening.x + px(outerRadiusMm(evarCase, sacStart)), y: widening.y }], { x: -130, y: 135 });
await clickOn(page.getByRole("button", { name: /mark this slice as aneurysm start/i }), 6);
const neckLengthHeading = page.locator("#evar-panel-measure").getByRole("heading", { name: "Neck length", exact: true });
await panelStill("neck-length", neckLengthHeading, neckLengthHeading.locator("xpath=following-sibling::ul[1]"));
await holdUntil(start, "length");

// Down to the widest slice of the sac, zoomed out to fit it.
const sacSlice = Array.from({ length: evarCase.bifurcationSlice }, (_, z) => z).reduce((best, z) =>
  outerRadiusMm(evarCase, z) > outerRadiusMm(evarCase, best) ? z : best,
);
const sac = evarCase.centreAt(sacSlice);
const sacR = px(reference.maxSac / 2);
start = framesUsed();
await clearNotes();
say(caption.sac);
await scan.slider.focus();
for (let z = sacStart + 1; z <= sacSlice; z += 1) {
  await page.keyboard.press("ArrowRight");
  await frame(2);
}
await scan.zoomOut();
const sacEnds = await scan.caliper(sac, reference.maxSac / 2, 3);
await note("Outer wall to outer wall", sacEnds, { x: (sacEnds[0].x + sacEnds[1].x) / 2, y: sacEnds[0].y - 150 });
await label("Thrombus", [{ x: sac.x, y: sac.y + sacR * 0.55 }], { x: -170, y: 70 });
await frame(12);
await still("sac", surfaceBox, SCAN_STILL);
await clickOn(record("maximum sac diameter"), 4);
await holdUntil(start, "sac");

// Below the bifurcation, each common iliac where its limb will seal.
const iliacSlice = evarCase.bifurcationSlice + 6;
const iliacs = evarCase.iliacCentresAt(iliacSlice);
start = framesUsed();
await clearNotes();
say(caption.iliacs);
await scan.slider.focus();
for (let z = sacSlice + 1; z <= iliacSlice; z += 1) {
  await page.keyboard.press("ArrowRight");
  await frame(1);
}
await scan.zoomIn();
await label("Right common iliac", [{ x: iliacs.right.x, y: iliacs.right.y - px(reference.rightCia / 2) }], { x: -60, y: -110 });
await label("Left common iliac", [{ x: iliacs.left.x, y: iliacs.left.y - px(reference.leftCia / 2) }], { x: -10, y: -110 });
await scan.caliper(iliacs.right, reference.rightCia / 2, 2);
await clickOn(record("right common iliac diameter"), 3);
await scan.caliper(iliacs.left, reference.leftCia / 2, 3);
await still("iliacs", surfaceBox, SCAN_STILL);
await clickOn(record("left common iliac diameter"), 4);
await holdUntil(start, "iliacs");

// Size the graft from the Endurant sheet.
const { mainBody, contraLimb, ipsiExtension } = endurantPick(evarCase);
start = framesUsed();
await clearNotes();
say(caption.graft);
await clickOn(page.getByRole("tab", { name: /size the graft/i }), 8);
for (const [name, code] of [[/main body/i, mainBody], [/contralateral limb/i, contraLimb], [/ipsilateral extension/i, ipsiExtension]]) {
  if (!code) continue;
  const select = page.getByRole("combobox", { name });
  await rec.glide(await rec.centreOf(select), 6);
  await select.selectOption(code);
  await frame(10);
}
await panelStill("graft", page.getByRole("group", { name: /main body goes up the/i }), page.getByRole("combobox", { name: /ipsilateral extension/i }));
await holdUntil(start, "graft");

// Check the answers, with the camera on the results.
start = framesUsed();
say(caption.check);
await clickOn(page.getByRole("button", { name: /check answers/i }), 4);
const results = page.getByRole("dialog").first();
await results.waitFor();
await page.waitForTimeout(600);
// The dialog opens with its last button focused, scrolled to the bottom. Start at the top.
const scroller = async (to) =>
  results.evaluate((dialog, fraction) => {
    const box = [dialog, ...dialog.querySelectorAll("*")].find((el) => el.scrollHeight > el.clientHeight + 4);
    if (box) box.scrollTop = (box.scrollHeight - box.clientHeight) * fraction;
  }, to);
await scroller(0);
const dialogBox = await results.boundingBox();
const cameraY = Math.min(VIEWPORT.height - STAGE.height, Math.max(0, dialogBox.y - 12));
await moveCamera({ ...STAGE, y: cameraY }, 10);
await frame(FPS * 2);
const checkClip = { x: dialogBox.x, y: dialogBox.y, width: dialogBox.width, height: Math.min(dialogBox.height, (dialogBox.width * 920) / 1280) };
await still("check", checkClip, { width: 1280, height: Math.round((checkClip.height * 1280) / checkClip.width) });
const scrollFrames = 30;
for (let i = 1; i <= scrollFrames; i += 1) {
  const t = i / scrollFrames;
  await scroller(t * t * (3 - 2 * t));
  await frame(1);
}
await holdUntil(start, "check");

// Closing card.
start = framesUsed();
await card("EVAR Sizing", caption.end);
say("");
await holdUntil(start, "end");

console.log(`case ${evarCase.id}, main body ${mainBody ?? "none"}, contralateral limb ${contraLimb ?? "none"}, extension ${ipsiExtension ?? "none"}`);
await rec.close();
