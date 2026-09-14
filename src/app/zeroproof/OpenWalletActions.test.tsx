import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "@/test/a11y";
import OpenWalletActions from "./OpenWalletActions";
import type { ZeroproofWallet } from "@/lib/zeroproof/schemas";

const wallet = (mode: "season" | "challenge"): ZeroproofWallet =>
  ({ id: `w-${mode}`, mode, status: "active" }) as unknown as ZeroproofWallet;

const renderActions = (wallets?: ZeroproofWallet[]) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <OpenWalletActions wallets={wallets} />
    </QueryClientProvider>,
  );
};

describe("OpenWalletActions", () => {
  it("names both wallet types and explains what each gives and limits", () => {
    renderActions();
    expect(screen.getByRole("heading", { name: /season/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /challenge/i })).toBeInTheDocument();
    // Season is deposit-based and refunded; Challenge is a fixed $100 that can bust.
    expect(screen.getByText(/deposit/i)).toBeInTheDocument();
    expect(screen.getByText(/\$100/)).toBeInTheDocument();
    expect(screen.getByText(/bust/i)).toBeInTheDocument();
    // Both note the 3-month term.
    expect(screen.getAllByText(/term/i).length).toBeGreaterThan(0);
  });

  it("disables the Season button when a season wallet is already active", () => {
    renderActions([wallet("season")]);
    expect(
      screen.getByRole("button", { name: /open a season wallet/i }),
    ).toBeDisabled();
  });

  it("disables the Challenge button when a challenge wallet is already active", () => {
    renderActions([wallet("challenge")]);
    expect(
      screen.getByRole("button", { name: /open a challenge wallet/i }),
    ).toBeDisabled();
  });

  it("leaves the other button enabled when only one mode is active", () => {
    renderActions([wallet("challenge")]);
    expect(
      screen.getByRole("button", { name: /open a season wallet/i }),
    ).toBeEnabled();
  });

  it("enables both when no wallet is open", () => {
    renderActions([]);
    expect(
      screen.getByRole("button", { name: /open a season wallet/i }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: /open a challenge wallet/i }),
    ).toBeEnabled();
  });

  it("has no a11y violations", async () => {
    const { container } = renderActions([]);
    expect(await axe(container)).toHaveNoViolations();
  });
});
