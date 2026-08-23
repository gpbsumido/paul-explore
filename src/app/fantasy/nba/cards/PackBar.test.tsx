import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PackBar, { type RipSlate } from "./PackBar";

const slate: RipSlate = { sport: "nba", mode: "nightly", date: "2026-04-17", week: null };

/** A minimal fetch Response stand-in that PackBar's handlers understand. */
const res = (status: number, body: unknown) => ({
  status,
  ok: status < 400,
  json: async () => body,
});

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => vi.restoreAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe("PackBar", () => {
  it("prompts a guest to sign in", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => res(401, null)));
    renderWithClient(<PackBar slate={slate} />);
    const link = await screen.findByRole("link", { name: /sign in/i });
    expect(link).toHaveAttribute("href", "/auth/login");
  });

  it("shows the balance and disables ripping when short on coins", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => res(200, { balance: 50, lastClaimDate: null })));
    renderWithClient(<PackBar slate={slate} />);
    expect(await screen.findByText("50")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Rip a pack/i })).toBeDisabled();
  });

  it("rips a pack and reveals the pulled cards", async () => {
    const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
      if (url.endsWith("/wallet")) return res(200, { balance: 300, lastClaimDate: null });
      if (url.endsWith("/packs/open")) {
        return res(200, {
          balance: 200,
          added: 1,
          cards: [{ id: "nba-1-2026-04-17", playerName: "Star", rarity: "sir" }],
        });
      }
      return res(200, {});
    });
    vi.stubGlobal("fetch", fetchMock);
    renderWithClient(<PackBar slate={slate} />);

    await userEvent.click(await screen.findByRole("button", { name: /Rip a pack/i }));

    expect(await screen.findByText("You pulled")).toBeInTheDocument();
    expect(screen.getByText("Star")).toBeInTheDocument();
    const openCall = fetchMock.mock.calls.find(([u]) => String(u).endsWith("/packs/open"));
    expect(JSON.parse((openCall?.[1] as RequestInit).body as string)).toMatchObject({
      sport: "nba",
      date: "2026-04-17",
    });
  });
});
