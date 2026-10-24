// What the EVAR video recorders share: record-evar-intro.mjs and record-evar-how-to.mjs.
//
// It opens the practice in a headless browser, with a second page that puts
// each screenshot under an 80 px caption band, which is what gets saved. A
// drawn cursor glides to each control before it's clicked, and calipers land
// where the phantom's own geometry says the walls are. Each recorder writes a
// frame list that scripts/encode-frames.swift turns into an H.264 MP4.

import { register } from "node:module";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
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

const { anatomyFor, referenceFor } = await import("../src/lib/evar/phantom.ts");
const { SHEETS, gradeDevices, gradeLengths } = await import("../src/lib/evar/sheets.ts");
const { fullView, toViewport, zoomAt } = await import("../src/lib/evar/zoom.ts");

export const FPS = 30;

const overlay = `
  #intro-card { position: fixed; display: grid; place-content: center; gap: 14px; text-align: center;
    background: #0e0e10; color: #fff; z-index: 2147483646; font-family: ui-sans-serif, system-ui, sans-serif; }
  #intro-card h1 { margin: 0; font-size: 64px; font-weight: 700; letter-spacing: -0.02em; }
  #intro-card p { margin: 0; font-size: 26px; color: rgba(255, 255, 255, 0.72); }
  #intro-cursor { position: fixed; left: 0; top: 0; width: 26px; height: 26px; z-index: 2147483647; pointer-events: none;
    transform: translate(-3px, -2px); filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6)); }
  nextjs-portal, [class*="tsqd"] { display: none !important; }`;

/**
 * Opens the browser and the caption compositor, and hands back what a
 * recorder films with. `storage` goes into localStorage before every page
 * load, on top of the dark theme and a tour already seen. The camera is the
 * part of the page, in CSS pixels, that fills the video under the caption; it
 * starts on the top of the viewport.
 */
export async function openRecorder({ base, out, scenes, viewport = { width: 1280, height: 640 }, deviceScaleFactor = 1, storage = {} }) {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const caption = Object.fromEntries(scenes.map((s) => [s.id, s.caption]));
  const seconds = Object.fromEntries(scenes.map((s) => [s.id, s.seconds]));

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport, deviceScaleFactor });
  // A second page puts each screenshot under a caption band, which is what gets saved.
  const compositor = await (await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })).newPage();
  await compositor.setContent(`<body style="margin:0;background:#0e0e10">
  <div style="display:grid;grid-template-rows:80px 640px;width:1280px;height:720px">
    <div id="caption" style="display:grid;place-items:center;padding:0 48px;color:#fff;text-align:center;font:600 23px/1.3 ui-sans-serif,system-ui,sans-serif"></div>
    <img id="shot" alt="" style="display:block;width:1280px;height:640px">
  </div></body>`);
  // No cookie banner and no tour, so the frames show the practice itself.
  await context.addCookies([{ name: "cookie_consent", value: "declined", url: base }]);
  await context.addInitScript(
    (items) => {
      try {
        for (const [key, value] of Object.entries(items)) localStorage.setItem(key, value);
      } catch {}
    },
    { "theme-preference": "dark", "evar-tour-seen": "true", ...storage },
  );
  const page = await context.newPage();

  /** Frames so far: each a screenshot and how many video frames it's held for. */
  const frames = [];
  let shot = 0;
  let captionNow = "";
  let camera = { x: 0, y: 0, width: 1280, height: 640 };
  let cursorAt = { x: 640, y: 420 };

  /** Takes a screenshot of what the camera sees, puts the caption above it, and holds it for `count` frames. */
  async function frame(count = 1) {
    const png = await page.screenshot({ clip: camera });
    await compositor.evaluate(
      async ([b64, text]) => {
        const img = document.getElementById("shot");
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        document.getElementById("caption").textContent = text;
      },
      [png.toString("base64"), captionNow],
    );
    const file = join(out, `${String(shot++).padStart(5, "0")}.png`);
    await compositor.screenshot({ path: file });
    frames.push([file, count]);
    return file;
  }
  const framesUsed = () => frames.reduce((sum, [, n]) => sum + n, 0);

  /** Points the camera at another part of the page, easing there over `steps` frames, or cutting when it's 0. */
  async function moveCamera(to, steps = 0) {
    const from = camera;
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const ease = t * t * (3 - 2 * t);
      camera = Object.fromEntries(Object.keys(to).map((k) => [k, from[k] + (to[k] - from[k]) * ease]));
      await frame(1);
    }
    camera = { ...to };
  }

  /** Adds the cursor and the card styles. Safe to call again after a page load. */
  async function dress() {
    await page.addStyleTag({ content: overlay });
    await page.evaluate((at) => {
      document.getElementById("intro-cursor")?.remove();
      const cursor = document.createElement("div");
      cursor.id = "intro-cursor";
      cursor.innerHTML =
        '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M3 2l17 10-7 2-3 7z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>';
      cursor.style.left = `${at.x}px`;
      cursor.style.top = `${at.y}px`;
      document.body.append(cursor);
    }, cursorAt);
  }

  function say(text) {
    captionNow = text;
  }

  /** Puts a title card over what the camera sees, or takes it away when `title` is null. The cursor hides while it's up. */
  async function card(title, line) {
    await page.evaluate(
      ([t, l, box]) => {
        document.getElementById("intro-card")?.remove();
        const cursor = document.getElementById("intro-cursor");
        if (cursor) cursor.style.visibility = t ? "hidden" : "visible";
        if (!t) return;
        const el = document.createElement("div");
        el.id = "intro-card";
        el.innerHTML = `<h1></h1><p></p>`;
        el.querySelector("h1").textContent = t;
        el.querySelector("p").textContent = l;
        Object.assign(el.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.width}px`, height: `${box.height}px` });
        document.body.append(el);
      },
      [title, line, camera],
    );
  }

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

  /** Pads the current scene out to its length in the scene list, and says so when it ran over. */
  async function holdUntil(sceneStart, id) {
    const left = seconds[id] * FPS - (framesUsed() - sceneStart);
    if (left > 0) await frame(left);
    else if (left < 0) console.warn(`scene "${id}" ran ${(-left / FPS).toFixed(1)} s over`);
  }

  /** Writes the frame list for the encoder and closes the browser. */
  async function close() {
    writeFileSync(join(out, "frames.txt"), frames.map(([file, n]) => `${file}\t${n}`).join("\n") + "\n");
    console.log(`${frames.length} screenshots, ${framesUsed()} frames (${(framesUsed() / FPS).toFixed(1)} s) in ${out}`);
    await browser.close();
  }

  return { page, compositor, caption, frame, framesUsed, moveCamera, dress, say, card, glide, centreOf, clickOn, holdUntil, close };
}

/**
 * The practice's scan, driven the way a person would: the slice slider, the
 * zoom buttons, and calipers clicked onto the outer wall. The view is mirrored
 * here so an image point can be found on screen at any zoom.
 */
export function scanTools(rec, evarCase) {
  const { page } = rec;
  const surface = page.getByRole("application", { name: /axial ct slice/i });
  const slider = page.locator("#evar-slice");
  let view = fullView(evarCase.size);

  /** Where an image point is on screen, through the viewer's current zoom. */
  async function onScreen(point) {
    const box = await surface.boundingBox();
    const at = toViewport(view, point, evarCase.size);
    return { x: box.x + at.x * box.width, y: box.y + at.y * box.height };
  }

  /** The zoom buttons scale about the middle of the view, so the mirror does too. */
  async function zoom(name, factor) {
    await rec.clickOn(page.getByRole("button", { name }), 8);
    view = zoomAt(view, factor, { x: view.x, y: view.y }, evarCase.size);
  }

  return {
    surface,
    slider,
    onScreen,
    zoomIn: () => zoom(/^zoom in$/i, 2),
    zoomOut: () => zoom(/^zoom out$/i, 1 / 2),
    async toSlice(z) {
      await slider.fill(String(z));
      await page.waitForTimeout(60);
    },
    /** Clicks a caliper onto each side of a vessel, across the image, and returns where they landed on screen. */
    async caliper(centre, radiusMm, hold = 4) {
      const r = radiusMm / evarCase.pixelMm;
      const ends = [];
      for (const point of [{ x: centre.x - r, y: centre.y }, { x: centre.x + r, y: centre.y }]) {
        const at = await onScreen(point);
        await rec.glide(at, 6);
        await page.mouse.click(at.x, at.y);
        await rec.frame(hold);
        ends.push(at);
      }
      return ends;
    },
  };
}

/**
 * An Endurant graft for a phantom: a main body whose own diameters fit the
 * neck and the main body's side, a contralateral limb that fits the other
 * iliac, and an extension only if the main body's leg doesn't. The first pick
 * whose lengths land too wins.
 */
export function endurantPick(evarCase) {
  const reference = referenceFor(evarCase);
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
  console.log(`lengths land: ${lands(best)}`);
  return best;
}
