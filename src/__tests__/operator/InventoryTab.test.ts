import { createElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  categorizeStock,
  computeInventorySummary,
} from "@/lib/operator-detail";
import InventoryRow from "@/components/operator/InventoryRow";
import { buildInventoryItem } from "@/test/factories/operator";
import type { InventoryItem } from "@/types/operator";

vi.mock("recharts", async (importOriginal) => {
  const { withFixedChartSize } = await import("@/test/chartSize");
  return withFixedChartSize(await importOriginal<typeof import("recharts")>());
});

// ---------------------------------------------------------------------------
// These tests verify the behavior the InventoryTab rows rely on: which items
// qualify for restocking, which get visual urgency treatment, and how summary
// stats reflect a realistic inventory mix. The row cases render the real
// InventoryRow, so a change to its button, badge or border is what fails.
// ---------------------------------------------------------------------------

/** Renders one row and hands back the spy that watches its Restock button. */
function renderRow(
  item: InventoryItem,
  props: { isRestocking?: boolean; isRestocked?: boolean } = {},
) {
  const onRestock = vi.fn();
  const { container } = render(
    createElement(InventoryRow, {
      item,
      onRestock,
      isRestocking: false,
      ...props,
    }),
  );
  return { onRestock, row: container.firstElementChild };
}

// ---------------------------------------------------------------------------
// One row per stock status
// ---------------------------------------------------------------------------

describe("inventory row by stock status", () => {
  it.each([
    ["out of stock", 0, "Out of Stock", true, true],
    ["critical", 1, "Critical", true, true],
    ["low", 4, "Low", true, false],
    ["healthy", 10, "Healthy", false, false],
  ])(
    "an item that is %s shows its badge, offers a restock only if it needs one, and flags urgency only when critical",
    (_name, currentStock, badge, canRestock, hasUrgentBorder) => {
      const { row } = renderRow(buildInventoryItem({ currentStock, capacity: 12 }));

      expect(screen.getByText(badge)).toBeInTheDocument();
      const restock = screen.getByRole("button", { name: "Restock" });
      if (canRestock) expect(restock).toBeEnabled();
      else expect(restock).toBeDisabled();
      if (hasUrgentBorder) expect(row).toHaveClass("border-l-error-500");
      else expect(row).not.toHaveClass("border-l-error-500");
    },
  );

  it("asks to restock the item it shows when Restock is clicked", async () => {
    const { onRestock } = renderRow(
      buildInventoryItem({ id: "item-7", currentStock: 1, capacity: 12 }),
    );

    await userEvent.click(screen.getByRole("button", { name: "Restock" }));

    expect(onRestock).toHaveBeenCalledExactlyOnceWith("item-7");
  });

  it("disables the button while that restock is in flight", () => {
    renderRow(buildInventoryItem({ currentStock: 1, capacity: 12 }), { isRestocking: true });

    expect(screen.getByRole("button", { name: "Restocking..." })).toBeDisabled();
  });

  it("swaps the button for a Restocked note once it is done", () => {
    renderRow(buildInventoryItem({ currentStock: 12, capacity: 12 }), { isRestocked: true });

    expect(screen.getByText("Restocked")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /restock/i })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Where one status turns into the next
// ---------------------------------------------------------------------------

describe("categorizeStock thresholds", () => {
  it.each([
    [0, 12, "out-of-stock"],
    [1, 12, "critical"],
    [19, 100, "critical"],
    [2, 10, "low"],
    [5, 12, "low"],
    [6, 12, "healthy"],
    [12, 12, "healthy"],
  ])("%i of %i is %s", (currentStock, capacity, status) => {
    expect(categorizeStock(currentStock, capacity)).toBe(status);
  });
});

// ---------------------------------------------------------------------------
// Summary with a realistic inventory mix
// ---------------------------------------------------------------------------

describe("summary with realistic inventory mix", () => {
  const realisticInventory: readonly InventoryItem[] = [
    buildInventoryItem({ currentStock: 12, capacity: 12 }), // healthy (100%)
    buildInventoryItem({ currentStock: 8, capacity: 12 }), // healthy (67%)
    buildInventoryItem({ currentStock: 4, capacity: 12 }), // low (33%)
    buildInventoryItem({ currentStock: 2, capacity: 12 }), // low (17% -> critical)
    buildInventoryItem({ currentStock: 1, capacity: 12 }), // critical (8%)
    buildInventoryItem({ currentStock: 0, capacity: 12 }), // out-of-stock (0%)
  ];

  it("identifies the correct number of items needing restock", () => {
    const summary = computeInventorySummary(realisticInventory);
    // items at 8% (critical) and 0% (out-of-stock) need restock
    // item at 17% is also critical (2/12 = 16.7%)
    expect(summary.needsRestock).toBe(3);
  });

  it("computes fill percentage across all items", () => {
    const summary = computeInventorySummary(realisticInventory);
    // (12+8+4+2+1+0) / (12*6) = 27/72 = 37.5% -> rounds to 38%
    expect(summary.fillPercentage).toBe(38);
  });

  it("counts all items regardless of status", () => {
    const summary = computeInventorySummary(realisticInventory);
    expect(summary.totalItems).toBe(6);
  });

  it("reports zeros, not NaN, for a store with no inventory", () => {
    expect(computeInventorySummary([])).toEqual({
      totalItems: 0,
      needsRestock: 0,
      fillPercentage: 0,
    });
  });
});
