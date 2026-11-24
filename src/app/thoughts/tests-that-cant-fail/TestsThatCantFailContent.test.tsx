import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TestsThatCantFailContent from "./TestsThatCantFailContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("TestsThatCantFailContent", () => {
  it("renders the write-up heading", () => {
    render(<TestsThatCantFailContent />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Tests that can't fail" }),
    ).toBeInTheDocument();
  });

  it("pastes the real failures instead of describing them", () => {
    const { container } = render(<TestsThatCantFailContent />);
    expect(container.textContent).toContain("expected 6 to be 1");
    expect(container.textContent).toContain(
      "ESLint found too many warnings (maximum: 0).",
    );
    expect(container.textContent).toContain("Tests  4 passed (4)");
  });

  it("has a section on what to watch for when an AI writes the tests or reports on them", () => {
    render(<TestsThatCantFailContent />);
    expect(
      screen.getByRole("heading", {
        name: /watch for this when an ai is writing the tests, or reporting on them/i,
      }),
    ).toBeInTheDocument();
  });

  it("has a dated update on the twenty fixed bugs", () => {
    render(<TestsThatCantFailContent />);
    expect(
      screen.getByRole("heading", {
        name: /the twenty bugs, fixed, and the three i got wrong on the way/i,
      }),
    ).toBeInTheDocument();
  });

  it("links to the Green Checks write-up, which links back", () => {
    render(<TestsThatCantFailContent />);
    expect(screen.getByRole("link", { name: "Green Checks" })).toHaveAttribute(
      "href",
      "/thoughts/green-checks",
    );
  });

  it("links to the error messages write-up's section on AI-written code", () => {
    render(<TestsThatCantFailContent />);
    expect(
      screen.getByRole("link", { name: "Errors people can read" }),
    ).toHaveAttribute("href", "/thoughts/error-messages");
  });

  it("describes the AI generically, without naming a product", () => {
    const { container } = render(<TestsThatCantFailContent />);
    expect(container.textContent).not.toMatch(
      /claude|anthropic|copilot|chatgpt|openai/i,
    );
  });
});
