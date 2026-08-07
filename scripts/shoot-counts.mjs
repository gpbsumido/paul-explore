import { chromium, devices } from "@playwright/test";
import { mkdirSync } from "fs";

const OUT = process.argv[2];
const BASE = process.argv[3] ?? "http://localhost:3000";

const HIDE = `nextjs-portal, [class*="tsqd"] { display: none !important }`;

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

/** Phone first — this is the viewport the layout is designed for. */
const PHONE = { ...devices["iPhone 13"], deviceScaleFactor: 1 };
const DESKTOP = { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 };

async function shoot(name, ctxOpts, path, theme, drive, settle = 40000) {
  const context = await browser.newContext(ctxOpts);
  const page = await context.newPage();
  await page.addInitScript((t) => {
    localStorage.setItem("theme-preference", t);
  }, theme);
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ content: HIDE });
  await page.waitForTimeout(settle);
  if (drive) await drive(page);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log("shot", name);
  await context.close();
}

const openCounts = async (page) => {
  await page.getByRole("tab", { name: "Counts" }).click();
  await page.waitForTimeout(1200);
};

// Phone
await shoot("phone-tabs", PHONE, "/research", "dark", null, 40000);
await shoot("phone-counts", PHONE, "/research", "dark", openCounts, 40000);
await shoot("phone-demographics", PHONE, "/research", "dark", async (page) => {
  await page.getByRole("tab", { name: "Demographics" }).click();
  await page.waitForTimeout(40000);
}, 40000);

// Desktop
await shoot("counts", DESKTOP, "/research", "light", openCounts, 22000);
await shoot("counts-filtered", DESKTOP, "/research", "light", async (page) => {
  await openCounts(page);
  await page.getByRole("button", { name: "Fewest papers" }).click();
  await page.getByRole("button", { name: "Indigenous peoples" }).click();
  await page.waitForTimeout(60000);
}, 40000);
await shoot("thoughts", DESKTOP, "/thoughts/research-explorer", "light", null, 4000);

await browser.close();
