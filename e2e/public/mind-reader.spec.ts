import { test, expect } from "@playwright/test";

// The one check that needs a real build: the Svelte component is compiled by
// our own loader, so unit tests (which use the Svelte Vite plugin) can't tell
// whether Turbopack actually produced something that mounts and runs.
test("a round of The Mind Reader plays through", { tag: "@smoke" }, async ({ page }) => {
  await page.goto("/mind-reader");

  await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();
  await page.getByRole("button", { name: "Deal a role" }).click();

  await expect(page.getByRole("heading", { name: "Player A: your secret role" })).toBeFocused();
  await page.getByRole("button", { name: "Hide it and start the clock" }).click();
  await expect(page.getByRole("timer")).toContainText(/^[45]:\d\d$/);

  await page.getByRole("button", { name: "Player B guessed it" }).click();
  await expect(page.getByRole("heading", { name: "Got it" })).toBeVisible();
  await expect(page.getByText("1 guessed")).toBeVisible();
});
