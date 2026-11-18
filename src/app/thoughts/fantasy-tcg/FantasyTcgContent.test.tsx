import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import FantasyTcgContent from "./FantasyTcgContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("FantasyTcgContent", () => {
  it("renders the write-up heading", () => {
    render(<FantasyTcgContent />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Fantasy TCG" }),
    ).toBeInTheDocument();
  });

  it("links to the Card Lab it documents", () => {
    render(<FantasyTcgContent />);
    const links = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(links).toContain("/fantasy/nba/cards");
  });

  it("carries the rip-pool update, linked from the timeline", () => {
    render(<FantasyTcgContent />);
    expect(document.getElementById("update-rip-pool")).not.toBeNull();
    expect(
      screen.getByRole("link", { name: /a pack from a slate you weren.t looking at/i }),
    ).toHaveAttribute("href", "#update-rip-pool");
  });
});
