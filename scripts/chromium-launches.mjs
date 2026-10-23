// Exits 0 when Playwright's Chromium starts on this machine, and 1 with the
// reason when it won't, which is almost always missing system libraries.
// scripts/install-playwright.sh asks this before reaching for apt.

import { chromium } from "@playwright/test";

try {
  const browser = await chromium.launch({ timeout: 30_000 });
  await browser.close();
} catch (error) {
  const reason = error instanceof Error ? error.message.split("\n")[0] : String(error);
  console.log(`Chromium won't start yet, so its system packages are next: ${reason}`);
  process.exit(1);
}
