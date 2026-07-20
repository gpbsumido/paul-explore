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
});
