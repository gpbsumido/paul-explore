import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "cookie_consent", value: "declined", url: baseURL! }]);
});

test("@smoke homepage scenes, pause and project filters work", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Paul Sumido");
  await page.getByRole("radio", { name: "Perspective", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(page.locator(".portrait-hero--tunnel")).toBeVisible();
  await page.getByRole("radio", { name: "Corridor", exact: true }).click();
  await expect(page.locator(".portrait-hero--corridor")).toBeVisible();
  await page.getByRole("radio", { name: "Spiral", exact: true }).click();
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await expect(page.getByRole("button", { name: "Resume motion", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".portrait-hero__image").first()).toHaveCSS("animation-play-state", "paused");
  await page.getByRole("button", { name: "Resume motion", exact: true }).click();
  await expect(page.locator(".portrait-hero__image").first()).toHaveCSS("animation-play-state", "running");
  await page.getByRole("radio", { name: "Play", exact: true }).click();
  const projects = page.getByRole("list", { name: "Projects", exact: true });
  await expect(projects.getByRole("listitem")).toHaveCount(1);
  await expect(projects.getByRole("link")).toHaveAttribute("href", "/world");
  await page.getByRole("radio", { name: "All", exact: true }).click();
  await expect(projects.getByRole("listitem")).toHaveCount(6);
});

for (const theme of ["light", "dark"] as const) {
  test(`@a11y ${theme} homepage has no axe violations`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("theme-preference", value), theme);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await page.getByRole("button", { name: "Pause motion", exact: true }).click();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

for (const width of [320, 375, 768, 1440]) {
  test(`homepage fits a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Explore the work/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.getByRole("radio", { name: "Systems", exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test("reduced motion keeps the scene still and the controls usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".portrait-hero__image").first()).toHaveCSS("animation-play-state", "paused");
  await page.mouse.move(300, 300);
  await expect(page.locator(".portrait-hero__gallery")).toHaveCSS("transform", "none");
  await page.getByRole("radio", { name: "Corridor", exact: true }).click();
  await expect(page.locator(".portrait-hero__poster").first()).toHaveCSS("animation-play-state", "paused");
  await page.getByRole("radio", { name: "Play", exact: true }).click();
  await expect(page.getByRole("list", { name: "Projects" }).getByRole("link")).toHaveAttribute("href", "/world");
});

test("failed decorative images leave the hero usable", async ({ page }) => {
  await page.route("**/landing/featured/*.jpg", route => route.abort());
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /Explore the work/ })).toHaveAttribute("href", "#work");
  await page.getByRole("radio", { name: "Perspective", exact: true }).click();
  await expect(page.getByRole("link", { name: /Resume/ }).first()).toBeVisible();
});

test("homepage hydrates without recovering from a render mismatch", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("radio", { name: "Perspective", exact: true }).click();
  await expect(page.locator(".portrait-hero--tunnel")).toBeVisible();
  expect(errors).toEqual([]);
});
