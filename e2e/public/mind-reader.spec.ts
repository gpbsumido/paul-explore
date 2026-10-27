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

// CI has no Ably key, so the room falls back to a BroadcastChannel. Two pages
// in one browser context share it, which is enough to prove the two halves of
// the game talk to each other and that player B's page never gets the role.
test("two tabs play a round as a room", async ({ context }) => {
  const host = await context.newPage();
  await host.goto("/mind-reader");
  await host.getByRole("button", { name: "Start a room" }).click();
  const code = (await host.getByTestId("room-code").textContent())?.trim() ?? "";
  expect(code).toMatch(/^[A-Z2-9]{5}$/);

  const guest = await context.newPage();
  await guest.goto(`/mind-reader?room=${code}`);
  await expect(guest.getByRole("heading", { name: "Player A is picking a deck" })).toBeVisible();

  await host.getByRole("button", { name: "Deal a role" }).click();
  const role = (await host.getByTestId("secret-role").textContent())?.trim() ?? "";
  await expect(guest.getByRole("heading", { name: "Player A is reading their role" })).toBeVisible();

  await host.getByRole("button", { name: "Hide it and start the clock" }).click();
  await expect(guest.getByRole("timer")).toContainText(/^[45]:\d\d$/);
  await expect(guest.getByText(role)).toHaveCount(0);

  await guest.getByRole("button", { name: "I guessed it" }).click();
  await expect(host.getByRole("heading", { name: "Got it" })).toBeVisible();
  await expect(guest.getByText(role)).toBeVisible();
});
