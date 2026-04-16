import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import FantasyNav from "../FantasyNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/fantasy/nba/matchups",
}));

describe("FantasyNav", () => {
  it("renders all navigation links", () => {
    render(<FantasyNav />);

    expect(screen.getByRole("link", { name: "Matchups" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Playoffs" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "League History" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Player Stats" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Court Vision" }),
    ).toBeInTheDocument();
  });

  it("renders the Playoffs link pointing to /fantasy/nba/playoffs", () => {
    render(<FantasyNav />);

    const playoffsLink = screen.getByRole("link", { name: "Playoffs" });
    expect(playoffsLink).toHaveAttribute("href", "/fantasy/nba/playoffs");
  });

  it("marks the current path as active", () => {
    render(<FantasyNav />);

    // Active link has the active indicator (bottom bar span) while others don't
    const matchupsLink = screen.getByRole("link", { name: "Matchups" });
    expect(matchupsLink.querySelector("span")).toBeInTheDocument();

    const playoffsLink = screen.getByRole("link", { name: "Playoffs" });
    expect(playoffsLink.querySelector("span")).not.toBeInTheDocument();
  });
});
