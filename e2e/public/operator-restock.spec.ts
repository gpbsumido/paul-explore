import { test, expect, type Page } from "@playwright/test";

/**
 * The restock flow, driven the way a restocker would.
 *
 * This tier exists here for a specific reason. The component tests render
 * RestockFlow on its own, which is why they never noticed that the Inventory
 * tab's "Start restock" button led to a second "Start restock" inside the flow.
 * Two taps for one action, and it took a screenshot to spot. Rendering a
 * component in isolation cannot catch a seam between two components; this can.
 *
 * Everything runs against the seeded demo data, which the BFF serves whether or
 * not the backend is up, so these do not need portfolio_api running.
 */

const STORE = "/operator/stores/store-002";

async function openInventoryTab(page: Page) {
  await page.goto(`${STORE}?tab=inventory`);
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("button", { name: "Start restock" }),
  ).toBeVisible();
}

/** The slot rows carry the expected count, which is how the list is identified. */
function slotButtons(page: Page) {
  return page.getByRole("button", { name: /expects \d+/ });
}

test.describe("operator restock flow", () => {
  test.beforeEach(async ({ page }) => {
    // A leftover session id would send the flow to the resume prompt instead.
    await page.goto(STORE);
    await page.evaluate(() =>
      window.localStorage.removeItem("operator-restock-session:store-002"),
    );
  });

  test("entering the flow opens a session without a second tap", async ({
    page,
  }) => {
    await openInventoryTab(page);
    await page.getByRole("button", { name: "Start restock" }).click();

    // The regression this file exists for: one tap should land on the slot list.
    await expect(page.getByText(/slots done/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Start restock" }),
    ).toBeHidden();
  });

  test("a removal cannot be saved without a reason", async ({ page }) => {
    await openInventoryTab(page);
    await page.getByRole("button", { name: "Start restock" }).click();
    await slotButtons(page).first().click();

    await page.getByRole("button", { name: "Increase units removed" }).click();
    await page.getByRole("button", { name: "Save slot" }).click();

    await expect(page.getByText(/Pick a reason before saving/)).toBeVisible();

    await page.getByRole("radio", { name: "Expired" }).click();
    await page.getByRole("button", { name: "Save slot" }).click();

    // Saving returns to the list, so the slot list is visible again.
    await expect(page.getByText(/slots done/)).toBeVisible();
  });

  test("counting a slot carries through to the review step", async ({
    page,
  }) => {
    await openInventoryTab(page);
    await page.getByRole("button", { name: "Start restock" }).click();
    await slotButtons(page).first().click();

    await page.getByRole("button", { name: "Increase units added" }).click();
    await page.getByRole("button", { name: "Save slot" }).click();

    await page.getByRole("button", { name: /Review 1 change/ }).click();

    await expect(page.getByText(/Nothing has been applied yet/)).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("completing the restock changes the stock on the inventory tab", async ({
    page,
  }) => {
    await openInventoryTab(page);
    await page.getByRole("button", { name: "Start restock" }).click();

    const firstSlot = slotButtons(page).first();
    const label = (await firstSlot.textContent()) ?? "";
    const expected = Number(/expects (\d+)/.exec(label)?.[1] ?? "0");

    await firstSlot.click();
    await page.getByRole("button", { name: "Increase units added" }).click();
    await page.getByRole("button", { name: "Save slot" }).click();

    await page.getByRole("button", { name: /Review 1 change/ }).click();
    await page.getByRole("button", { name: "Complete restock" }).click();

    // Completing closes the flow and returns to the inventory tab.
    await expect(
      page.getByRole("button", { name: "Start restock" }),
    ).toBeVisible();

    // Nothing touches stock until complete, so the new figure only appears now.
    await expect(page.getByText(`${expected + 1}/`).first()).toBeVisible();
  });

  test("an abandoned session is offered back rather than lost", async ({
    page,
  }) => {
    await openInventoryTab(page);
    await page.getByRole("button", { name: "Start restock" }).click();
    await expect(page.getByText(/slots done/)).toBeVisible();

    // Walking away mid-shelf: the phone backgrounds, the tab reloads.
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Start restock" }).click();

    await expect(
      page.getByRole("button", { name: "Resume restock" }),
    ).toBeVisible();
    await expect(page.getByText(/restock in progress/)).toBeVisible();
  });

  test("works at a phone width, which is where it is actually used", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openInventoryTab(page);
    await page.getByRole("button", { name: "Start restock" }).click();
    await slotButtons(page).first().click();

    // Steppers rather than a keyboard, and big enough for a thumb.
    const increase = page.getByRole("button", { name: "Increase units added" });
    await expect(increase).toBeVisible();
    const box = await increase.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  });
});
