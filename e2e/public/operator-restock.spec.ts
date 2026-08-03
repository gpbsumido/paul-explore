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
 * Which backend these run against is a deliberate choice, and it took a red CI
 * run to get it right.
 *
 * They used to point at the seed id `store-002`. That looked like laziness but
 * had a subtler problem: with a real backend serving, the fleet comes back as
 * UUIDs, the API 404s for `store-002`, and the BFF falls back to the seed
 * exactly as designed -- so the specs passed identically whether or not the
 * backend worked. A test that cannot fail when the thing it covers is broken is
 * not a test.
 *
 * So I switched them to read a store id off the fleet page, and CI went red:
 * the deployed API is on an older release with no restock-session routes and no
 * migrations 016-018, so the flow genuinely could not open a session. The test
 * was right. But it was answering a question this tier should not be asking.
 * These exist to catch the seam between InventoryTab and RestockFlow -- the bug
 * where "Start restock" led to another "Start restock", which a component test
 * rendering RestockFlow alone could never see. That is a UI-composition
 * question, and pinning it to a separately-deployed service means the suite
 * reports someone else's deploy state and flips colour for reasons unrelated to
 * the change under review.
 *
 * So: the seed by default, deliberately and visibly rather than by accident,
 * because it is the one fixture that is deterministic and always present. Set
 * OPERATOR_E2E_LIVE=1 to resolve the store off the fleet instead and drive
 * whatever is really serving -- that is how the flow was verified end to end
 * against Postgres, six real restock sessions, before this landed. What the
 * default does NOT cover is integration, and that is the point of saying so
 * here instead of letting a silent fallback imply otherwise.
 */

/** A store the seed always has. The API will 404 it, which is what pins the seed. */
const SEED_STORE = "store-002";

/**
 * The store to drive. Live mode reads the first store off the fleet, so it runs
 * against whatever is actually serving; the default pins the seed so the run is
 * deterministic and independent of any deploy.
 */
async function resolveStoreId(page: Page): Promise<string> {
  if (!process.env.OPERATOR_E2E_LIVE) return SEED_STORE;

  await page.goto("/operator");
  const link = page.locator('a[href^="/operator/stores/"]').first();
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  const id = href!.split("/operator/stores/")[1].split("?")[0];

  // The whole reason this mode exists is to not be fooled by the seed. If the
  // API were unreachable the BFF would fall back and serve seed ids, and every
  // assertion below would still pass -- a green run proving nothing. Real
  // stores are UUIDs, so anything else means we are not talking to a database
  // and the run should say so rather than quietly pass.
  expect(
    id,
    `OPERATOR_E2E_LIVE is set but the fleet returned "${id}", which is a seed id. The BFF fell back, so this run would not have tested the API.`,
  ).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
  return id;
}

async function openInventoryTab(page: Page, storeId: string) {
  await page.goto(`/operator/stores/${storeId}?tab=inventory`);
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("button", { name: "Start restock" }),
  ).toBeVisible();
}

/** The slot rows carry the expected count, which is how the list is identified. */
function slotButtons(page: Page) {
  return page.getByRole("button", { name: /expects \d+/ });
}

// Tagged so the nightly public run can exclude it. That job points at the
// deployed API, and this is a write flow -- aiming it at production is wrong
// even when it happens to be harmless. The only reason it never wrote real rows
// is that the service token it lacked also stopped it, which is luck standing in
// for a decision. The e2e-operator-live tier owns these against a disposable
// database instead.
test.describe("operator restock flow @operator-write", () => {
  let storeId: string;

  test.beforeEach(async ({ page }) => {
    storeId = await resolveStoreId(page);
    // A leftover session id would send the flow to the resume prompt instead.
    await page.goto(`/operator/stores/${storeId}`);
    await page.evaluate(
      (id) => window.localStorage.removeItem(`operator-restock-session:${id}`),
      storeId,
    );
  });

  test("entering the flow opens a session without a second tap", async ({
    page,
  }) => {
    await openInventoryTab(page, storeId);
    await page.getByRole("button", { name: "Start restock" }).click();

    // The regression this file exists for: one tap should land on the slot list.
    await expect(page.getByText(/slots done/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Start restock" }),
    ).toBeHidden();
  });

  test("a removal cannot be saved without a reason", async ({ page }) => {
    await openInventoryTab(page, storeId);
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
    await openInventoryTab(page, storeId);
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
    await openInventoryTab(page, storeId);
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
    await openInventoryTab(page, storeId);
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
    await openInventoryTab(page, storeId);
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
