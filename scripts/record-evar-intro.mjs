#!/usr/bin/env node
// Records the welcome page's intro video from the real practice page.
//
// It drives /evar in a headless browser, takes a screenshot after every step,
// and writes a frame list that scripts/encode-frames.swift turns into an H.264
// MP4. Captions come from src/lib/evar/introScenes.ts, the same scenes the
// welcome page writes out as the transcript. Calipers land where the phantom's
// own geometry says the walls are, so the case it measures scores properly.
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

import { register } from "node:module";
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "@playwright/test";

// The EVAR modules import each other without file extensions, the way the app's
// bundler expects. Node needs the .ts spelled out, so this adds it.
register(
  "data:text/javascript," +
    encodeURIComponent(`
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    if (specifier.startsWith(".") && !/\\.[cm]?[jt]s$/.test(specifier)) return next(specifier + ".ts", context);
    throw error;
  }
}`),
);

const { INTRO_SCENES } = await import("../src/lib/evar/introScenes.ts");
const { EVAR_CASES, anatomyFor, outerRadiusMm, referenceFor } = await import("../src/lib/evar/phantom.ts");
const { SHEETS, gradeDevices, gradeLengths } = await import("../src/lib/evar/sheets.ts");
const { fullView, toViewport, zoomAt } = await import("../src/lib/evar/zoom.ts");

const BASE = process.argv[2] ?? "http://localhost:3000";
const FPS = 30;
const OUT = join(tmpdir(), "evar-intro-frames");
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const caption = Object.fromEntries(INTRO_SCENES.map((s) => [s.id, s.caption]));
const seconds = Object.fromEntries(INTRO_SCENES.map((s) => [s.id, s.seconds]));

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 1 });
// A second page puts each screenshot under a caption band, which is what gets saved.
const compositor = await (await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })).newPage();
await compositor.setContent(`<body style="margin:0;background:#0e0e10">
  <div style="display:grid;grid-template-rows:80px 640px;width:1280px;height:720px">
    <div id="caption" style="display:grid;place-items:center;padding:0 48px;color:#fff;text-align:center;font:600 23px/1.3 ui-sans-serif,system-ui,sans-serif"></div>
    <img id="shot" alt="" style="display:block;width:1280px;height:640px">
  </div></body>`);
// No cookie banner and no tour, so the frames show the practice itself.
await context.addCookies([{ name: "cookie_consent", value: "declined", url: BASE }]);
await context.addInitScript(() => {
  try {
    localStorage.setItem("theme-preference", "dark");
    localStorage.setItem("evar-tour-seen", "true");
  } catch {}
});
const page = await context.newPage();

/** Frames so far: each a screenshot and how many video frames it's held for. */
const frames = [];
let shot = 0;
let captionNow = "";
/** Takes a screenshot, puts the caption under it, and holds it for `count` frames. */
async function frame(count = 1) {
  const png = await page.screenshot();
  await compositor.evaluate(
    async ([b64, text]) => {
      const img = document.getElementById("shot");
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      document.getElementById("caption").textContent = text;
    },
    [png.toString("base64"), captionNow],
  );
  const file = join(OUT, `${String(shot++).padStart(5, "0")}.png`);
  await compositor.screenshot({ path: file });
  frames.push([file, count]);
  return file;
}
const framesUsed = () => frames.reduce((sum, [, n]) => sum + n, 0);

const overlay = `
  #intro-card { position: fixed; inset: 0; display: grid; place-content: center; gap: 14px; text-align: center;
    background: #0e0e10; color: #fff; z-index: 2147483646; font-family: ui-sans-serif, system-ui, sans-serif; }
  #intro-card h1 { margin: 0; font-size: 64px; font-weight: 700; letter-spacing: -0.02em; }
  #intro-card p { margin: 0; font-size: 26px; color: rgba(255, 255, 255, 0.72); }
  #intro-cursor { position: fixed; left: 0; top: 0; width: 26px; height: 26px; z-index: 2147483647; pointer-events: none;
    transform: translate(-3px, -2px); filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6)); }
  nextjs-portal, [class*="tsqd"] { display: none !important; }`;

async function dress() {
  await page.addStyleTag({ content: overlay });
  await page.evaluate(() => {
    const cursor = document.createElement("div");
    cursor.id = "intro-cursor";
    cursor.innerHTML =
      '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M3 2l17 10-7 2-3 7z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    cursor.style.left = "640px";
    cursor.style.top = "420px";
    document.body.append(cursor);
  });
}

function say(text) {
  captionNow = text;
}

async function card(title, line) {
  await page.evaluate(
    ([t, l]) => {
      document.getElementById("intro-card")?.remove();
      if (!t) return;
      const el = document.createElement("div");
      el.id = "intro-card";
      el.innerHTML = `<h1></h1><p></p>`;
      el.querySelector("h1").textContent = t;
      el.querySelector("p").textContent = l;
      document.body.append(el);
    },
    [title, line],
  );
}

let cursorAt = { x: 640, y: 420 };
/** Glides the drawn cursor to a point, a frame at a time. */
async function glide(to, steps = 8) {
  const from = cursorAt;
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const ease = t * t * (3 - 2 * t);
    const x = from.x + (to.x - from.x) * ease;
    const y = from.y + (to.y - from.y) * ease;
    await page.evaluate(([px, py]) => {
      const c = document.getElementById("intro-cursor");
      if (c) Object.assign(c.style, { left: `${px}px`, top: `${py}px` });
    }, [x, y]);
    await frame(1);
  }
  cursorAt = to;
}

async function centreOf(locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("nothing to point at");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Moves to a control on screen, then clicks it, holding a few frames after. */
async function clickOn(locator, hold = 6) {
  await locator.scrollIntoViewIfNeeded();
  await glide(await centreOf(locator));
  await locator.click();
  await page.waitForTimeout(150);
  await frame(hold);
}

/** Pads the current scene out to its length in the scene list. */
async function holdUntil(sceneStart, id) {
  const left = seconds[id] * FPS - (framesUsed() - sceneStart);
  if (left > 0) await frame(left);
}

// Opening: the page loads behind the title card.
await page.goto(`${BASE}/evar`, { waitUntil: "networkidle" });
await dress();
const studyDialog = page.getByRole("dialog", { name: /research study/i });
await studyDialog.waitFor();

let start = framesUsed();
await card("EVAR Sizing", caption.title.replace(/^EVAR Sizing: /, "").replace(/^./, (c) => c.toUpperCase()));
say("");
await holdUntil(start, "title");

// The study question comes first.
start = framesUsed();
await card(null, null);
say(caption.study);
await frame(FPS * 3);
await clickOn(studyDialog.getByRole("button", { name: /practise without joining/i }), 10);
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
const neckSlice = evarCase.lowestRenalSlice + 1;

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
const surface = page.getByRole("application", { name: /axial ct slice/i });
const size = evarCase.size;
let view = fullView(size);
/** Where an image point is on screen, through the viewer's current zoom. */
async function onScreen(point) {
  const box = await surface.boundingBox();
  const at = toViewport(view, point, size);
  return { x: box.x + at.x * box.width, y: box.y + at.y * box.height };
}
async function caliper(z, centre, radiusMm, hold = 4) {
  const r = radiusMm / evarCase.pixelMm;
  for (const point of [{ x: centre.x - r, y: centre.y }, { x: centre.x + r, y: centre.y }]) {
    const at = await onScreen(point);
    await glide(at, 6);
    await page.mouse.click(at.x, at.y);
    await frame(hold);
  }
}
async function toSlice(z) {
  await slider.fill(String(z));
  await page.waitForTimeout(60);
}
const record = (label) => page.getByRole("button", { name: new RegExp(`record caliper as ${label}`, "i") });

start = framesUsed();
say(caption.caliper);
await clickOn(page.getByRole("button", { name: /^zoom in$/i }), 8);
view = zoomAt(view, 2, { x: view.x, y: view.y }, size);
await caliper(neckSlice, evarCase.centreAt(neckSlice), outerRadiusMm(evarCase, neckSlice), 10);
copyFileSync(await frame(1), join(OUT, "poster.png"));
await holdUntil(start, "caliper");

// Record that one, then the other four, quickly.
start = framesUsed();
say(caption.record);
await clickOn(record("proximal neck diameter"), 6);
await toSlice(evarCase.lowestRenalSlice);
await clickOn(page.getByRole("button", { name: /mark this slice as lowest renal artery/i }), 3);
await toSlice(reference.sacStartSlice);
await clickOn(page.getByRole("button", { name: /mark this slice as aneurysm start/i }), 3);
const sacSlice = Array.from({ length: evarCase.bifurcationSlice }, (_, z) => z).reduce((best, z) =>
  outerRadiusMm(evarCase, z) > outerRadiusMm(evarCase, best) ? z : best,
);
await toSlice(sacSlice);
await caliper(sacSlice, evarCase.centreAt(sacSlice), reference.maxSac / 2, 2);
await clickOn(record("maximum sac diameter"), 3);
const iliacSlice = evarCase.bifurcationSlice + 6;
await toSlice(iliacSlice);
const iliacs = evarCase.iliacCentresAt(iliacSlice);
await caliper(iliacSlice, iliacs.right, reference.rightCia / 2, 2);
await clickOn(record("right common iliac diameter"), 3);
await caliper(iliacSlice, iliacs.left, reference.leftCia / 2, 2);
await clickOn(record("left common iliac diameter"), 4);
await holdUntil(start, "record");

// Size the graft from the Endurant sheet: a main body whose own diameters fit the neck and this
// side's iliac, a contralateral limb that fits the other, and an extension only if the main body's leg doesn't.
const sheet = SHEETS.endurant;
const codes = (groups) => groups.flatMap((g) => g.devices.map((d) => d.code));
const pickBase = { sheet: "endurant", ipsilateral: "right", mainBody: null, contraLimb: null, ipsiExtension: null };
const matches = (pick, ...ids) => {
  const grades = gradeDevices(pick, reference, {});
  return ids.every((id) => grades.find((g) => g.id === id)?.verdict === "match");
};
const anatomy = anatomyFor(evarCase);
const yours = anatomyFor(evarCase, { renal: evarCase.lowestRenalSlice });
const lands = (pick) => gradeLengths(pick, anatomy, yours).every((g) => g.verdict === "match");
const mainBodies = codes(sheet.catalogue.mainBodies).filter((code) => matches({ ...pickBase, mainBody: code }, "mainBody"));
const extensions = [null, ...codes(sheet.catalogue.ipsiExtensions)];
const picks = mainBodies.flatMap((mainBody) =>
  codes(sheet.catalogue.contraLimbs).flatMap((contraLimb) =>
    extensions.map((ipsiExtension) => ({ ...pickBase, mainBody, contraLimb, ipsiExtension })),
  ),
);
const best =
  picks.find((pick) => matches(pick, "mainBody", "contralateral", "ipsilateral") && lands(pick)) ??
  picks.find((pick) => matches(pick, "mainBody", "contralateral", "ipsilateral"));
if (!best) throw new Error(`no Endurant pick matches ${evarCase.id}`);
const { mainBody, contraLimb, ipsiExtension } = best;
console.log(`lengths land: ${lands(best)}`);

start = framesUsed();
say(caption.graft);
await clickOn(page.getByRole("tab", { name: /size the graft/i }), 8);
for (const [label, code] of [[/main body/i, mainBody], [/contralateral limb/i, contraLimb], [/ipsilateral extension/i, ipsiExtension]]) {
  if (!code) continue;
  const select = page.getByRole("combobox", { name: label });
  await glide(await centreOf(select), 6);
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

writeFileSync(join(OUT, "frames.txt"), frames.map(([file, n]) => `${file}\t${n}`).join("\n") + "\n");
console.log(`${frames.length} screenshots, ${framesUsed()} frames (${(framesUsed() / FPS).toFixed(1)} s) in ${OUT}`);
console.log(`case ${evarCase.id}, main body ${mainBody ?? "none"}, contralateral limb ${contraLimb ?? "none"}, extension ${ipsiExtension ?? "none"}`);
await browser.close();
