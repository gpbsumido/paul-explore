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
});
