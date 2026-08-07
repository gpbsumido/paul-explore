import { chromium, devices } from "@playwright/test";
import { mkdirSync } from "fs";
const OUT = "/tmp/shots-before2";
const HIDE = `nextjs-portal, [class*="tsqd"] { display: none !important }`;
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const PHONE = { ...devices["iPhone 13"], deviceScaleFactor: 1 };

async function shoot(name, opts, path, theme, wait, drive) {
  const ctx = await b.newContext(opts);
  const page = await ctx.newPage();
  await page.addInitScript((t) => localStorage.setItem("theme-preference", t), theme);
  await page.goto(`http://localhost:3010${path}`, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ content: HIDE });
  await page.waitForTimeout(wait);
  if (drive) await drive(page);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("shot", name);
  await ctx.close();
}

await shoot("phone-tabs", PHONE, "/research", "dark", 30000);
await shoot("phone-demographics", PHONE, "/research", "dark", 25000, async (page) => {
  await page.getByRole("tab", { name: "Demographics" }).click();
  await page.waitForTimeout(40000);
});
await shoot("thoughts", { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 },
  "/thoughts/research-explorer", "light", 4000);
await b.close();
