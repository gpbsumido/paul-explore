import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import BudgetThoughtsContent from "./BudgetThoughtsContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("BudgetThoughtsContent", () => {
  it("renders the write-up heading", () => {
    render(<BudgetThoughtsContent />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Three taps to log a spend" }),
    ).toBeInTheDocument();
  });

  it("links to the feature it documents", () => {
    render(<BudgetThoughtsContent />);
    const links = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(links).toContain("/budget");
  });
});
