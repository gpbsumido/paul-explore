import { test, expect } from "@playwright/test";
import { disableTours } from "../helpers/tours";

/**
 * The composed page: /work-portfolio served by the micro-frontend remote.
 *
 * Only meaningful when a remote is configured and forced on, so the whole file
 * skips otherwise. To run it locally, serve the remote's build
 * (`pnpm --filter work-portfolio-remote preview` in work-portfolio-mfe) and
 * start this app with
 *   WORK_PORTFOLIO_REMOTE_URL=http://localhost:3100/mf-manifest.json
 *   WORK_PORTFOLIO_REMOTE_OVERRIDE=on
 * With those set, work-portfolio.spec.ts runs against the composed page too.
 */
const MANIFEST = process.env.WORK_PORTFOLIO_REMOTE_URL;
const REMOTE_ORIGIN = MANIFEST ? new URL(MANIFEST).origin : "";

test.skip(
  !MANIFEST || process.env.WORK_PORTFOLIO_REMOTE_OVERRIDE !== "on",
  "no work-portfolio remote configured and forced on",
);

test.describe("work portfolio from the remote", () => {
  // No reduced-motion emulation here, unlike work-portfolio.spec.ts: these
  // never click the moving tickers, and under reduced motion template.tsx
  // currently throws a hydration mismatch on every route, which would drown
  // out the "nothing thrown" check below.
  test.beforeEach(async ({ page }) => {
    await disableTours(page);
  });

  test("loads its code from the remote's origin and names the release", async ({
    page,
  }) => {
    const fromRemote: string[] = [];
    page.on("request", (r) => {
      if (r.url().startsWith(REMOTE_ORIGIN)) fromRemote.push(r.url());
    });

    await page.goto("/work-portfolio");

    await expect(page.getByText(/feature demos/)).toBeVisible();
    expect(fromRemote.some((u) => u.endsWith("/mf-manifest.json"))).toBe(true);
    expect(fromRemote.some((u) => u.endsWith(".js"))).toBe(true);
    await expect(page.getByRole("link", { name: /remote v\d+\.\d+\.\d+/ })).toBeVisible();
  });

  test("runs on the host's React, not a second copy", async ({ page }) => {
    await page.goto("/work-portfolio");
    await expect(page.getByText(/feature demos/)).toBeVisible();

    // The share scope lists every React that was offered. The remote offers
    // its own as a fallback; the one actually in use has been loaded.
    const loaded = await page.evaluate(() => {
      type Shared = Record<string, Record<string, { loaded?: boolean; from: string }>>;
      const g = globalThis as unknown as {
        __FEDERATION__: { __SHARE__: Record<string, { default: Shared }> };
      };
      const react = Object.values(g.__FEDERATION__.__SHARE__)[0].default.react;
      return Object.values(react)
        .filter((entry) => entry.loaded)
        .map((entry) => entry.from);
    });
    expect(loaded).toEqual(["paulExplore"]);
  });

  test("falls back without taking the page down when the remote is unreachable", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route(`${REMOTE_ORIGIN}/**`, (route) => route.abort());

    await page.goto("/work-portfolio");

    // Next's route announcer is also role="alert", so pick ours by its words
    await expect(
      page.getByRole("alert").filter({ hasText: /didn't load/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
    // the failure stayed inside RemoteMount: nothing thrown on this page...
    expect(errors).toEqual([]);
    // ...and the header is the host's, and still works
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).not.toHaveURL(/work-portfolio/);
  });

  test("leaving the page unmounts the remote and its key handler", async ({
    page,
  }) => {
    await page.goto("/work-portfolio?feature=chart-library");
    await expect(page.getByRole("heading", { name: "Chart Library" })).toBeVisible();

    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page).not.toHaveURL(/work-portfolio/);
    const url = page.url();
    await page.keyboard.press("ArrowRight");
    expect(page.url()).toBe(url);
  });
});
