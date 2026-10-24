#!/usr/bin/env node
// Records the welcome page's intro video from the real pages.
//
// It starts on /evar/welcome, where the study question is, follows the link to
// the practice, and takes a screenshot after every step. Captions come from
// src/lib/evar/introScenes.ts, the same scenes the welcome page writes out as
// the transcript. The browser, the caption band and the cursor are in
// scripts/evar-video.mjs, shared with the how-to recorder.
//
//   node scripts/record-evar-intro.mjs [base url]      (default http://localhost:3000)
//   swift scripts/encode-frames.swift <frames>/frames.txt public/evar/welcome/intro.mp4 30 900000
//
// The page renders at 1280 by 640 and each frame gets an 80 px caption band
// above it, so a caption never covers a control, and the player's own
// controls never cover a caption. poster.png, in the same folder as the
// frames, is the measuring stage for the video's poster.
//
// Needs a running server. macOS only for the encode, since it uses AVFoundation.

import { copyFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FPS, endurantPick, openRecorder, scanTools } from "./evar-video.mjs";

const { INTRO_SCENES } = await import("../src/lib/evar/introScenes.ts");
const { EVAR_CASES, outerRadiusMm, referenceFor } = await import("../src/lib/evar/phantom.ts");

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = join(tmpdir(), "evar-intro-frames");
const rec = await openRecorder({ base: BASE, out: OUT, scenes: INTRO_SCENES });
const { page, caption, frame, framesUsed, dress, say, card, clickOn, holdUntil } = rec;
const seconds = Object.fromEntries(INTRO_SCENES.map((s) => [s.id, s.seconds]));

// Opening: the welcome page loads behind the title card.
await page.goto(`${BASE}/evar/welcome`, { waitUntil: "networkidle" });
await dress();
const invite = page.getByRole("region", { name: /join the study/i });

let start = framesUsed();
await card("EVAR Sizing", caption.title.replace(/^EVAR Sizing: /, "").replace(/^./, (c) => c.toUpperCase()));
say("");
await holdUntil(start, "title");

// The study question comes first, on the welcome page, and practising doesn't need it.
start = framesUsed();
// Just under the sticky site header, so nothing above the question is half in view.
await invite.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 96));
await card(null, null);
say(caption.study);
await frame(FPS * 3);
await clickOn(invite.getByRole("link", { name: /practise without joining/i }), 2);
await page.waitForURL(/\/evar$/);
await page.getByRole("application", { name: /axial ct slice/i }).waitFor();
await page.waitForLoadState("networkidle");
await dress();
await frame(8);
await holdUntil(start, "study");

// The page opens on a real CT. Scroll through some of it.
start = framesUsed();
say(caption.scan);
await frame(FPS);
const slider = page.locator("#evar-slice");
await slider.focus();
for (let i = 0; i < 24; i += 1) {
  await page.keyboard.press("ArrowDown");
  await frame(3);
}
await holdUntil(start, "scan");

// Easy, on the first phantom, scrolled down to the neck.
// The pills are visually hidden radios inside their labels.
await page.getByRole("radio", { name: "Easy" }).check({ force: true });
await page.waitForTimeout(300);
const caseTitle = (await page.locator('label:has(input[name="evar-case"]:checked)').textContent())?.trim() ?? "";
const evarCase = EVAR_CASES.find((c) => c.title === caseTitle);
if (!evarCase) throw new Error(`no phantom called "${caseTitle}"`);
const reference = referenceFor(evarCase);
// Two slices down, where the renal artery's last glow has gone, the same slice the how-to measures.
const neckSlice = evarCase.lowestRenalSlice + 2;
const scan = scanTools(rec, evarCase);

start = framesUsed();
say(caption.slices);
await slider.fill("0");
await frame(FPS / 2);
await slider.focus();
const steps = Math.max(1, neckSlice);
const perStep = Math.max(1, Math.floor((seconds.slices * FPS - FPS) / steps));
for (let z = 1; z <= neckSlice; z += 1) {
  await page.keyboard.press("ArrowRight");
  await frame(perStep);
}
await holdUntil(start, "slices");

// Zoom in, then calipers across the neck at its outer wall.
const record = (label) => page.getByRole("button", { name: new RegExp(`record caliper as ${label}`, "i") });

start = framesUsed();
say(caption.caliper);
await scan.zoomIn();
await scan.caliper(evarCase.centreAt(neckSlice), outerRadiusMm(evarCase, neckSlice), 10);
copyFileSync(await frame(1), join(OUT, "poster.png"));
await holdUntil(start, "caliper");

// Record that one, then the other four, quickly.
start = framesUsed();
say(caption.record);
await clickOn(record("proximal neck diameter"), 6);
await scan.toSlice(evarCase.lowestRenalSlice);
await clickOn(page.getByRole("button", { name: /mark this slice as lowest renal artery/i }), 3);
await scan.toSlice(reference.sacStartSlice);
await clickOn(page.getByRole("button", { name: /mark this slice as aneurysm start/i }), 3);
const sacSlice = Array.from({ length: evarCase.bifurcationSlice }, (_, z) => z).reduce((best, z) =>
  outerRadiusMm(evarCase, z) > outerRadiusMm(evarCase, best) ? z : best,
);
await scan.toSlice(sacSlice);
await scan.caliper(evarCase.centreAt(sacSlice), reference.maxSac / 2, 2);
await clickOn(record("maximum sac diameter"), 3);
const iliacSlice = evarCase.bifurcationSlice + 6;
await scan.toSlice(iliacSlice);
const iliacs = evarCase.iliacCentresAt(iliacSlice);
await scan.caliper(iliacs.right, reference.rightCia / 2, 2);
await clickOn(record("right common iliac diameter"), 3);
await scan.caliper(iliacs.left, reference.leftCia / 2, 2);
await clickOn(record("left common iliac diameter"), 4);
await holdUntil(start, "record");

// Size the graft from the Endurant sheet.
const { mainBody, contraLimb, ipsiExtension } = endurantPick(evarCase);

start = framesUsed();
say(caption.graft);
await clickOn(page.getByRole("tab", { name: /size the graft/i }), 8);
for (const [label, code] of [[/main body/i, mainBody], [/contralateral limb/i, contraLimb], [/ipsilateral extension/i, ipsiExtension]]) {
  if (!code) continue;
  const select = page.getByRole("combobox", { name: label });
  await rec.glide(await rec.centreOf(select), 6);
  await select.selectOption(code);
  await frame(12);
}
await holdUntil(start, "graft");

// Check the answers.
start = framesUsed();
say(caption.results);
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
await frame(Math.round(FPS * 2.5));
const scrollFrames = 40;
for (let i = 1; i <= scrollFrames; i += 1) {
  const t = i / scrollFrames;
  await scroller(t * t * (3 - 2 * t));
  await frame(1);
}
await holdUntil(start, "results");

// Closing card.
start = framesUsed();
await card("EVAR Sizing", caption.end);
say("");
await holdUntil(start, "end");

console.log(`case ${evarCase.id}, main body ${mainBody ?? "none"}, contralateral limb ${contraLimb ?? "none"}, extension ${ipsiExtension ?? "none"}`);
await rec.close();
