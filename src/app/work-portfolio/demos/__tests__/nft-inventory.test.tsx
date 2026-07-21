import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NftInventoryDemo from "../nft-inventory";
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
});
