import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";

// The Pocket page is force-dynamic and reads portfolio_api's mirrored catalog.
// When that read fails the page used to render nothing: no <main> landmark, and
// the a11y e2e timed out waiting for one. It must degrade to an accessible
// fallback instead, and a rolled-out-to-nobody visitor must get the flag page.
const fetchCatalog = vi.hoisted(() => vi.fn());
const loadPocketGate = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "visitor" }) }),
}));
vi.mock("@/lib/flags-gate", () => ({ loadPocketGate }));
vi.mock("@/lib/tcg-catalog", () => ({ fetchCatalog }));
vi.mock("@/components/PageHeader", () => ({ default: () => null }));

import PocketPage from "./page";

const set = (id: string, name: string, official: number | null) => ({
  id,
  name,
  logo: null,
  symbol: null,
  cardCountOfficial: official,
  cardCountTotal: official === null ? null : official + 60,
});

// The full-size game's series comes first on purpose: the page has to pick
// Pocket out by id, not take whichever series is listed first.
const catalogWith = (sets: ReturnType<typeof set>[]) => ({
  series: [
    {
      id: "swsh",
      name: "Sword & Shield",
      logo: null,
      sets: [set("swsh1", "Sword & Shield Base", 202)],
    },
    { id: "tcgp", name: "Pokémon TCG Pocket", logo: null, sets },
  ],
  updatedAt: "2026-08-30T05:00:00.000Z",
});

async function renderPage() {
  return render(await PocketPage());
}

beforeEach(() => {
  vi.clearAllMocks();
  loadPocketGate.mockResolvedValue({ enabled: true });
});

describe("PocketPage when the catalog cannot be read", () => {
  it("renders a main landmark with an accessible unavailable message, not a throw", async () => {
    fetchCatalog.mockResolvedValue(null);
    await renderPage();

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
  });

  it("says the same when the catalog has no Pocket series, or an empty one", async () => {
    fetchCatalog.mockResolvedValue({
      series: [{ id: "swsh", name: "Sword & Shield", logo: null, sets: [] }],
      updatedAt: null,
    });
    const first = await renderPage();
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
    first.unmount();

    fetchCatalog.mockResolvedValue({
      series: [{ id: "tcgp", name: "Pokémon TCG Pocket", logo: null, sets: [] }],
      updatedAt: null,
    });
    await renderPage();
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
  });
});

describe("PocketPage behind its feature flag", () => {
  it("tells a visitor outside the rollout so, and does not read the catalog", async () => {
    loadPocketGate.mockResolvedValue({ enabled: false });
    await renderPage();

    expect(
      screen.getByRole("heading", { name: /isn.t rolled out to you yet/i }),
    ).toBeInTheDocument();
    expect(fetchCatalog).not.toHaveBeenCalled();
  });
});

describe("PocketPage with a catalog", () => {
  it("groups mini-sets under their expansion and totals the official cards", async () => {
    fetchCatalog.mockResolvedValue(
      catalogWith([
        set("A1", "Genetic Apex", 226),
        set("A1a", "Mythical Island", 68),
        set("A2", "Space-Time Smackdown", 207),
        set("A10", "Future Set", 10),
        set("P-A", "Promo-A", null),
      ]),
    );
    await renderPage();

    // A1 and A1a share an expansion, A10 is its own (not A1 plus a stray 0):
    // five sets make four expansions, and the other series is left out.
    const stats = screen.getByText("Sets").parentElement!.parentElement!;
    expect(within(stats).getByText("5")).toBeInTheDocument();
    expect(within(stats).getByText("511")).toBeInTheDocument();
    expect(within(stats).getByText("4")).toBeInTheDocument();
    expect(screen.queryByText(/Sword & Shield Base/)).not.toBeInTheDocument();

    const apex = screen.getByRole("heading", { name: "Genetic Apex" }).closest("section")!;
    expect(
      within(apex).getByRole("link", { name: /Mythical Island/ }),
    ).toHaveAttribute("href", "/tcg/pokemon/sets/A1a");
    expect(
      screen.getByRole("heading", { name: "Promotional Cards" }),
    ).toBeInTheDocument();
  });
});
