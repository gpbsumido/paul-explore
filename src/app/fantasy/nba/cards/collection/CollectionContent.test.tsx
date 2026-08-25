import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CollectionContent from "./CollectionContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({ usePathname: () => "/fantasy/nba/cards/collection" }));

const res = (status: number, body: unknown) => ({ status, ok: status < 400, json: async () => body });

function renderWithClient(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const pull = (o: Record<string, unknown> = {}) => ({
  id: "p1",
  cardId: "nba-1-2026-04-17",
  rarity: "sir",
  playerName: "Victor Wembanyama",
  title: "Victor Wembanyama · 41 PTS",
  subtitle: "Apr 17 vs PHX",
  imageUrl: "https://a.espncdn.com/i/headshots/nba/players/full/1.png",
  points: 41,
  ...o,
});

afterEach(() => vi.unstubAllGlobals());

describe("CollectionContent", () => {
  it("prompts a guest to sign in", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => res(401, null)));
    renderWithClient(<CollectionContent />);
    expect(await screen.findByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/auth/login");
  });

  it("shows each card's points and rarity, with filter and sort controls", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => res(200, { cards: [pull()] })));
    renderWithClient(<CollectionContent />);

    expect(await screen.findByText("41")).toBeInTheDocument(); // points
    const article = screen.getByRole("article");
    expect(article).toHaveTextContent("SIR"); // rarity spelled out
    expect(screen.getByRole("group", { name: /filter by rarity/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument(); // sort
  });

  it("groups duplicate pulls into one card with a count", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => res(200, { cards: [pull(), pull({ id: "p2" })] })));
    renderWithClient(<CollectionContent />);
    expect(await screen.findByText("×2")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });
});
