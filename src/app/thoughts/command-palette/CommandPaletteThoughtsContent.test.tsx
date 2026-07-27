import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CommandPaletteThoughtsContent from "./CommandPaletteThoughtsContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("CommandPaletteThoughtsContent", () => {
  it("renders the write-up heading", () => {
    render(<CommandPaletteThoughtsContent />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Command Palette" }),
    ).toBeInTheDocument();
  });

  it("links to the hub and dev-notes index it builds its registry from", () => {
    render(<CommandPaletteThoughtsContent />);
    const links = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(links).toContain("/");
    expect(links).toContain("/thoughts");
  });
});
