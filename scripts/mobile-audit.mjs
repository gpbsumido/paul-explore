import { chromium, devices } from "@playwright/test";
import { mkdirSync } from "fs";

// Reusable phone-viewport audit. `node scripts/mobile-audit.mjs` against a
// running dev server prints, per route, whether the page scrolls sideways,
// which elements escape the viewport without a scrollable parent, and which
// interactive targets are under the comfortable minimum height.
//
// It is a tool rather than a test on purpose: jsdom has no layout, so none of
// this is measurable in the unit suite, and the honest way to check a phone
// layout is to render it at phone size and look.
const OUT = "/tmp/mobile-audit";
mkdirSync(OUT, { recursive: true });
const HIDE = `nextjs-portal, [class*="tsqd"] { display: none !important }`;

const ROUTES = [
  "/", "/work-portfolio", "/world", "/design-system", "/research", "/flags",
  "/operator", "/vitals", "/learn", "/craft", "/gallery-wall", "/fantasy/nba",
  "/pokemon", "/lab/particles", "/thoughts", "/resume", "/v4", "/tcg/pokemon",
];

const b = await chromium.launch();
const ctx = await b.newContext({ ...devices["iPhone 13"], deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.addInitScript(() => localStorage.setItem("theme-preference", "light"));

const results = [];
for (const route of ROUTES) {
  try {
    const resp = await page.goto(`http://localhost:3000${route}`, {
      waitUntil: "domcontentloaded", timeout: 45000,
    });
    await page.addStyleTag({ content: HIDE });
    await page.waitForTimeout(3500);

    const audit = await page.evaluate(() => {
      const vw = window.innerWidth;
      const doc = document.documentElement;
      // Elements whose box extends past the viewport, ignoring decorative
      // background blur layers which are meant to bleed.
      const overflow = [...document.querySelectorAll("body *")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return false;
          const cls = el.className?.toString?.() ?? "";
          if (/blur-|AmbientBackground|absolute inset/.test(cls)) return false;
          if (el.tagName === "svg" || el.closest("svg")) return false;
          return r.right > vw + 2 || r.left < -2;
        })
        .slice(0, 4)
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          cls: (el.className?.toString?.() ?? "").slice(0, 48),
          right: Math.round(el.getBoundingClientRect().right),
          text: (el.textContent ?? "").trim().slice(0, 28),
        }));

      // Interactive targets smaller than the 44px comfortable minimum.
      const small = [...document.querySelectorAll("a,button,[role=button],input,select")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          // The skip link is 1x1 until focused, which is correct.
        const cls = el.className?.toString?.() ?? "";
        // sr-only is 1x1 until focused, and .touch-target supplies a 44px
        // pseudo-element the bounding box does not include.
        if (cls.includes("sr-only") || cls.includes("touch-target")) return false;
        return r.width > 0 && r.height > 0 && r.height < 32;
        })
        .slice(0, 4)
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          h: Math.round(el.getBoundingClientRect().height),
          text: (el.textContent ?? "").trim().slice(0, 24),
        }));

      return {
        scrollsSideways: doc.scrollWidth > vw + 2,
        scrollWidth: doc.scrollWidth,
        viewport: vw,
        overflow,
        small,
      };
    });

    results.push({ route, status: resp?.status() ?? 0, ...audit });
    await page.screenshot({ path: `${OUT}${route.replace(/\//g, "_") || "_home"}.png` });
  } catch (e) {
    results.push({ route, error: String(e).slice(0, 70) });
  }
}
console.log(JSON.stringify(results, null, 1));
await b.close();
