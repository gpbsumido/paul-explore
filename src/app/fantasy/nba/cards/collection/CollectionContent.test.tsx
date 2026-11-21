import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CollectionContent from "./CollectionContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({ usePathname: () => "/fantasy/nba/cards/collection" }));
// Reduced motion: the card's count-up points render their final value at once.
vi.mock("@/app/providers", () => ({ useHubReducedMotion: () => true }));

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

  it("shows each card's points and rarity, with a chip counting each rarity owned", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res(200, { cards: [pull(), pull({ id: "p2", cardId: "c2", rarity: "common", playerName: "Role Player", points: 12 })] }),
      ),
    );
    renderWithClient(<CollectionContent />);

    expect(await screen.findByText("41")).toBeInTheDocument(); // points
    const sirCard = screen.getByRole("article", { name: /Victor Wembanyama/ });
    expect(sirCard).toHaveTextContent("SIR"); // rarity spelled out
    const chips = within(screen.getByRole("group", { name: /filter by rarity/i }));
    expect(chips.getByRole("button", { name: /^All\s*2$/ })).toBeInTheDocument();
    expect(chips.getByRole("button", { name: /^SIR\s*1$/ })).toBeInTheDocument();
    expect(chips.getByRole("button", { name: /^Common\s*1$/i })).toBeInTheDocument();
  });

  it("narrows the grid to one rarity when its chip is pressed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res(200, { cards: [pull(), pull({ id: "p2", cardId: "c2", rarity: "common", playerName: "Role Player" })] }),
      ),
    );
    const user = userEvent.setup();
    renderWithClient(<CollectionContent />);

    await user.click(await screen.findByRole("button", { name: /^Common\s*1$/i }));

    expect(screen.getByRole("article", { name: /Role Player/ })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: /Victor Wembanyama/ })).not.toBeInTheDocument();
  });

  it("orders by rarity to start with and by name when asked", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res(200, {
          cards: [
            pull({ id: "p2", cardId: "c2", rarity: "common", playerName: "Aaron Role" }),
            pull(),
          ],
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithClient(<CollectionContent />);

    const names = () =>
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    await screen.findByRole("article", { name: /Aaron Role/ });
    expect(names()).toEqual(["Victor Wembanyama", "Aaron Role"]);

    await user.selectOptions(screen.getByRole("combobox"), "name");
    expect(names()).toEqual(["Aaron Role", "Victor Wembanyama"]);
  });

  it("points an empty collection at the Card Lab instead of showing a blank grid", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => res(200, { cards: [] })));
    renderWithClient(<CollectionContent />);

    expect(await screen.findByText(/no cards yet/i)).toBeInTheDocument();
    expect(within(screen.getByText(/no cards yet/i)).getByRole("link", { name: /card lab/i })).toHaveAttribute(
      "href",
      "/fantasy/nba/cards",
    );
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("does not tell a signed-in user to sign in when the collection request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => res(500, { error: "boom" })));
    renderWithClient(<CollectionContent />);

    await screen.findByRole("heading", { name: /my collection/i });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
  });

  it("says the collection could not be loaded when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => res(500, { error: "boom" })));
    renderWithClient(<CollectionContent />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not load your collection/i);
  });

  it("groups duplicate pulls into one card with a count", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => res(200, { cards: [pull(), pull({ id: "p2" })] })));
    renderWithClient(<CollectionContent />);
    expect(await screen.findByText("×2")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });
});
