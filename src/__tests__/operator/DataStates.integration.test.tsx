import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import DataLoadError from "@/components/operator/DataLoadError";
import FleetStatsBar from "@/components/operator/FleetStatsBar";
import StoreCard from "@/components/operator/StoreCard";
import { buildStore } from "@/test/factories/operator";

/**
 * Loading, unknown and zero are three different things, and only one of them is
 * a number. Rendering the other two as 0 turns a failed request into a
 * confident claim about the fleet, which is the kind of wrong an operator acts
 * on without ever suspecting anything broke.
 */
describe("loading is not absence and absence is not zero", () => {
  const loadedStats = {
    totalStores: 6,
    needsAttention: 1,
    lowStockItems: 4,
    avgInventoryHealth: 68,
    criticalAlerts: 2,
    warningAlerts: 3,
  };

  it("shows a placeholder, not a number, while the summary is loading", () => {
    render(
      <FleetStatsBar
        stats={{ ...loadedStats, lowStockItems: null, avgInventoryHealth: null }}
        isLoading
      />,
    );

    expect(screen.getByLabelText(/low stock items, loading/i)).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
    expect(screen.queryByText(/null/i)).not.toBeInTheDocument();
  });

  it("shows a dash, not a zero, when the summary is missing", () => {
    render(
      <FleetStatsBar
        stats={{ ...loadedStats, lowStockItems: null, avgInventoryHealth: null }}
      />,
    );

    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
  });

  it("still shows a real zero as zero", () => {
    render(
      <FleetStatsBar
        stats={{ ...loadedStats, lowStockItems: 0, avgInventoryHealth: 0 }}
      />,
    );
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("never renders the word null on a store card", () => {
    render(
      <StoreCard store={buildStore()} alertCount={0} inventoryHealth={null} />,
    );
    expect(document.body.textContent).not.toMatch(/null/i);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("a store card in flight reads as pending rather than empty", () => {
    render(
      <StoreCard
        store={buildStore()}
        alertCount={0}
        inventoryHealth={null}
        isSummaryLoading
      />,
    );
    expect(screen.getByText("…")).toBeInTheDocument();
  });
});

describe("a failed load says so and offers a way out", () => {
  it("states it is an error rather than an empty store", () => {
    render(<DataLoadError what="the fleet summary" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText(/this is an error, not an empty store/i),
    ).toBeInTheDocument();
  });

  it("offers a retry when one is possible", async () => {
    const onRetry = vi.fn();
    render(<DataLoadError what="inventory" onRetry={onRetry} />);

    screen.getByRole("button", { name: /try again/i }).click();
    expect(onRetry).toHaveBeenCalled();
  });

  it("gives a contact route, because nobody here has a support channel", () => {
    render(<DataLoadError what="inventory" detail="503 from the API" />);

    const contact = screen.getByRole("link", { name: /tell me about it/i });
    expect(contact.getAttribute("href")).toMatch(/^mailto:/);
    // The report carries what failed, so it does not arrive as "it's broken".
    expect(contact.getAttribute("href")).toContain("inventory");
  });
});
