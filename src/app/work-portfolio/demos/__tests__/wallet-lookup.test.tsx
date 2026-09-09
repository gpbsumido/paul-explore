import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import WalletLookupDemo from "../wallet-lookup";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("wallet-lookup")!];

afterEach(() => vi.useRealTimers());

describe("wallet lookup demo", () => {
  it("opens on a sample wallet already resolved", () => {
    render(<WalletLookupDemo feature={feature} />);
    // No lonely empty prompt -- a wallet is loaded on arrival.
    expect(screen.queryByText("try a sample address")).toBeNull();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getByText(/token holdings/i)).toBeInTheDocument();
  });

  it("looks up an address and shows the overview with tabs", () => {
    render(<WalletLookupDemo feature={feature} />);
    fireEvent.change(screen.getByLabelText("Wallet address"), {
      target: { value: "0xdeadbeef" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Look up" }));
    expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByText(/token holdings/i)).toBeInTheDocument();
  });

  it("a sample chip runs the lookup immediately", () => {
    render(<WalletLookupDemo feature={feature} />);
    const chip = screen
      .getAllByRole("button")
      .find((b) => b.textContent?.startsWith("0x"))!;
    fireEvent.click(chip);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("the NFTs tab shows a loading state then content", async () => {
    vi.useFakeTimers();
    render(<WalletLookupDemo feature={feature} />);
    fireEvent.change(screen.getByLabelText("Wallet address"), {
      target: { value: "0xloadsofnfts" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Look up" }));
    fireEvent.click(screen.getByRole("tab", { name: /NFTs/ }));
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(600));
    expect(screen.queryByLabelText("Loading")).toBeNull();
  });
});
