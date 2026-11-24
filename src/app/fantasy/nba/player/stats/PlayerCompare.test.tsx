import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PlayerRow, PlayerStats } from "@/types/nba";
import PlayerCompare from "./PlayerCompare";

// recharts measures its container, which jsdom has no layout for. The raw
// stat table under the chart is what a reader can check, so the chart itself
// is out of scope here.
vi.mock("recharts", () => ({
  RadarChart: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  Radar: () => null,
  ResponsiveContainer: () => null,
}));

const stats = (overrides: Partial<PlayerStats>): PlayerStats => ({
  pts: 20,
  reb: 5,
  ast: 5,
  stl: 1,
  blk: 1,
  games_played: 40,
  min: "30:00",
  fgm: 7,
  fga: 15,
  fg_pct: 0.5,
  ft_pct: 0.8,
  fg3_pct: 0.36,
  turnover: 2,
  ...overrides,
});

const row = (id: number, name: string, played: Partial<PlayerStats> | null, error = false): PlayerRow => ({
  id,
  name,
  pos: "G",
  stats: played ? stats(played) : null,
  error,
});

const rows: PlayerRow[] = [
  row(1, "Ann Ames", { pts: 25.25, fg_pct: 0.512 }),
  row(2, "Bea Bright", { pts: 18, reb: 11, fg_pct: 0.471 }),
  row(3, "Cole Crash", null, true),
];

describe("PlayerCompare", () => {
  it("offers only the players whose stats loaded", () => {
    render(<PlayerCompare rows={rows} open />);

    const options = within(screen.getByLabelText("Player 1"))
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).toEqual(["Select player…", "Ann Ames", "Bea Bright"]);
  });

  it("asks for players until one is picked", () => {
    render(<PlayerCompare rows={rows} open />);
    expect(screen.getByText("Select players to compare")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("compares two players stat by stat, FG% as a percentage, and bolds the better figure", async () => {
    const user = userEvent.setup();
    render(<PlayerCompare rows={rows} open />);

    await user.selectOptions(screen.getByLabelText("Player 1"), "1");
    await user.selectOptions(screen.getByLabelText("Player 2"), "2");

    const table = screen.getByRole("table");
    const line = (label: string) => within(table).getByText(label).closest("tr")!;
    expect(within(table).getByRole("columnheader", { name: "Ames" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Bright" })).toBeInTheDocument();

    const pts = within(line("PTS")).getAllByRole("cell");
    expect(pts[1]).toHaveTextContent("25.3");
    expect(pts[2]).toHaveTextContent("18.0");
    expect(pts[1]).toHaveClass("font-bold");
    expect(pts[2]).not.toHaveClass("font-bold");

    const reb = within(line("REB")).getAllByRole("cell");
    expect(reb[2]).toHaveClass("font-bold");
    expect(reb[1]).not.toHaveClass("font-bold");

    expect(within(line("FG%")).getAllByRole("cell")[1]).toHaveTextContent("51.2%");
    expect(within(line("FG%")).getAllByRole("cell")[2]).toHaveTextContent("47.1%");
  });

  it("bolds neither figure when two players tie", async () => {
    const user = userEvent.setup();
    render(<PlayerCompare rows={rows} open />);

    await user.selectOptions(screen.getByLabelText("Player 1"), "1");
    await user.selectOptions(screen.getByLabelText("Player 2"), "2");

    // Both rows carry 5 assists and 1 steal.
    const ast = within(within(screen.getByRole("table")).getByText("AST").closest("tr")!).getAllByRole("cell");
    expect(ast[1]).not.toHaveClass("font-bold");
    expect(ast[2]).not.toHaveClass("font-bold");
  });

  it("renders nothing while closed", () => {
    render(<PlayerCompare rows={rows} open={false} />);
    expect(screen.queryByLabelText("Player 1")).not.toBeInTheDocument();
  });
});
