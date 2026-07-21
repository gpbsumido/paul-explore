import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import NftInventoryDemo, { transferAsset } from "../nft-inventory";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("nft-inventory")!];

describe("nft inventory demo", () => {
  it("reveals the inventory grid after connecting a wallet", () => {
    render(<NftInventoryDemo feature={feature} />);
    expect(screen.queryByLabelText("Inventory grid")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Connect wallet" }));
    expect(screen.getByLabelText("Inventory grid")).toBeInTheDocument();
  });

  it("opens a detail modal with the clicked asset's data", () => {
    render(<NftInventoryDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "Connect wallet" }));

    const firstCard = screen.getByLabelText("Inventory grid").querySelector("button");
    const assetName = firstCard?.textContent?.match(/Relic #\d+/)?.[0] ?? "";
    expect(assetName).not.toBe("");

    fireEvent.click(firstCard!);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(assetName);
    // metadata + provenance are on the modal, not the grid card
    expect(dialog).toHaveTextContent(/Token/i);
    expect(dialog).toHaveTextContent(/Provenance/i);
  });

  it("moves an asset between wallet panes in transfer mode", () => {
    render(<NftInventoryDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "Connect wallet" }));
    fireEvent.click(screen.getByRole("button", { name: /transfer/i }));

    const you = screen.getByRole("list", { name: "You" });
    const recipient = screen.getByRole("list", { name: "Recipient" });
    const countIn = (list: HTMLElement) => within(list).queryAllByRole("listitem").length;

    const startYou = countIn(you);
    expect(startYou).toBeGreaterThan(0);
    expect(countIn(recipient)).toBe(0);

    fireEvent.click(
      within(you).getAllByRole("button", { name: /send .* to recipient/i })[0],
    );

    expect(countIn(you)).toBe(startYou - 1);
    expect(countIn(recipient)).toBe(1);
  });

  it("transferAsset only reassigns the targeted asset", () => {
    const assets = [
      { id: 1, wallet: "me" as const },
      { id: 2, wallet: "me" as const },
    ];
    const next = transferAsset(assets, 1, "them");
    expect(next[0].wallet).toBe("them");
    expect(next[1].wallet).toBe("me");
  });
});
