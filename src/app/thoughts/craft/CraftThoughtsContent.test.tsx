import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CraftThoughtsContent from "./CraftThoughtsContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("CraftThoughtsContent", () => {
  it("renders the write-up heading", () => {
    render(<CraftThoughtsContent />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Craft" }),
    ).toBeInTheDocument();
  });

  it("links back to the /craft feature it documents", () => {
    render(<CraftThoughtsContent />);
    const links = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(links).toContain("/craft");
  });
});
