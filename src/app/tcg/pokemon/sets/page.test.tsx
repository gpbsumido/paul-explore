import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * This page renders from portfolio_api's mirrored catalog now. What it must
 * never do again is render "no sets" for two different reasons: a read that
 * failed and a catalog nobody has built yet used to look identical, which is
 * how an outage spent a day passing for data nobody had updated.
 */
const fetchCatalog = vi.hoisted(() => vi.fn());
vi.mock("@/lib/tcg-catalog", () => ({ fetchCatalog }));

vi.mock("@/components/PageHeader", () => ({
  default: () => <div data-testid="page-header" />,
}));

import SetsPage from "./page";

const serie = {
  id: "tcgp",
  name: "Pokémon TCG Pocket",
  logo: null,
  sets: [
    {
      id: "A1",
      name: "Genetic Apex",
      logo: null,
      symbol: null,
      cardCountOfficial: 226,
      cardCountTotal: 286,
    },
  ],
};

async function renderPage() {
  return render(await SetsPage());
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchCatalog.mockResolvedValue({ series: [serie], updatedAt: "2026-08-30T05:00:00.000Z" });
});

describe("sets page", () => {
  it("lists the series and their sets from the catalog", async () => {
    await renderPage();
    expect(screen.getByText("Pokémon TCG Pocket")).toBeInTheDocument();
    expect(screen.getByText("Genetic Apex")).toBeInTheDocument();
    expect(screen.getByText("1 sets")).toBeInTheDocument();
  });

  it("says the read failed rather than showing an empty list", async () => {
    fetchCatalog.mockResolvedValue(null);
    await renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.?t load/i);
  });

  it("says the catalog has not been built rather than that it failed", async () => {
    fetchCatalog.mockResolvedValue({ series: [], updatedAt: null });
    await renderPage();
    expect(screen.getByText(/hasn.?t been built yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a dash for a set whose card count is not published yet", async () => {
    fetchCatalog.mockResolvedValue({
      series: [
        { ...serie, sets: [{ ...serie.sets[0], cardCountOfficial: null }] },
      ],
      updatedAt: null,
    });
    await renderPage();
    // A dash, not a zero: an unknown count and a set with no cards are
    // different facts.
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
