import { chromium, devices } from "@playwright/test";
import { mkdirSync } from "fs";
const OUT = "/tmp/shots-new";
const HIDE = `nextjs-portal, [class*="tsqd"] { display: none !important }`;
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const DESKTOP = { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 };
const PHONE = { ...devices["iPhone 13"], deviceScaleFactor: 1 };

async function shoot(name, opts, theme, drive, settle) {
  const ctx = await b.newContext(opts);
  const page = await ctx.newPage();
  await page.addInitScript((t) => localStorage.setItem("theme-preference", t), theme);
  await page.goto("http://localhost:3000/research", { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ content: HIDE });
  await page.waitForTimeout(settle);
  if (drive) await drive(page);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("shot", name);
  await ctx.close();
}

// A population opened to its own papers.
await shoot("demographics-open", DESKTOP, "light", async (page) => {
  await page.getByRole("tab", { name: "Demographics" }).click();
  await page.waitForTimeout(45000);
  await page.getByRole("button", { name: /Indigenous peoples/ }).click();
  await page.waitForTimeout(12000);
}, 25000);

// Dead-end filters disabled after choosing a population.
await shoot("filters-disabled", DESKTOP, "light", async (page) => {
  await page.getByRole("button", { name: /CLTI revascularization on dialysis/ }).click();
  await page.waitForTimeout(9000);
  await page.getByText("Women", { exact: true }).click();
  await page.waitForTimeout(45000);
}, 25000);

// The scan-in-progress state on a phone.
await shoot("phone-scanning", PHONE, "dark", async (page) => {
  await page.getByRole("tab", { name: "Demographics" }).click();
  await page.waitForTimeout(2500);
}, 25000);

await b.close();
