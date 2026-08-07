import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";

const OUT = process.argv[2];
const BASE = process.argv[3] ?? "http://localhost:3000";

// Dev-only chrome that would otherwise clutter the shot.
const HIDE = `nextjs-portal, [class*="tsqd"] { display: none !important }`;

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shoot(name, theme, drive, settle = 26000) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.addInitScript((t) => {
    localStorage.setItem("theme-preference", t);
  }, theme);
  await page.goto(`${BASE}/research`, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ content: HIDE });
  await page.waitForTimeout(settle);
  if (drive) await drive(page);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("shot", name);
  await context.close();
}

await shoot("topics-light", "light");
await shoot("topics-dark", "dark");

await shoot("topic-open", "light", async (page) => {
  await page.getByRole("button", { name: /Complex EVAR in frail patients/ }).click();
  await page.waitForTimeout(6000);
  await page.getByRole("button", { name: /Complex EVAR in frail patients/ }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
});

await shoot("demographics", "light", async (page) => {
  await page.getByRole("tab", { name: "Demographics" }).click();
  await page.waitForTimeout(30000);
});

await shoot("discovered", "light", async (page) => {
  await page.getByRole("tab", { name: "Discovered" }).click();
  await page.waitForTimeout(70000);
});

// The hub gains a Research Explorer card.
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
await page.addInitScript(() => localStorage.setItem("theme-preference", "light"));
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.addStyleTag({ content: HIDE });
await page.waitForTimeout(4000);
await page.screenshot({ path: `${OUT}/hub.png` });
console.log("shot hub");
await context.close();

await browser.close();
