import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WalletLookupDemo from "../wallet-lookup";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("wallet-lookup")!];

describe("wallet lookup demo", () => {
  it("shows sample prompts before any lookup", () => {
    render(<WalletLookupDemo feature={feature} />);
    expect(screen.getByText("try a sample address")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  it("looks up an address and shows the overview with tabs", () => {
    render(<WalletLookupDemo feature={feature} />);
    fireEvent.change(screen.getByLabelText("Wallet address"), {
      target: { value: "0xdeadbeef" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Look up" }));
    expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByText("Balance")).toBeInTheDocument();
  });

  it("a sample chip runs the lookup immediately", () => {
    render(<WalletLookupDemo feature={feature} />);
    const chip = screen.getAllByRole("button").find((b) => b.textContent?.startsWith("0x"))!;
    fireEvent.click(chip);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });
});
