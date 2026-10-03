import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AgentPatternsContent from "./AgentPatternsContent";

describe("AgentPatternsContent", () => {
  it("shows its title and intro rather than rendering them hidden", () => {
    // The intro once spread a variants object onto its section, which turned
    // the variant named "hidden" into the HTML hidden attribute: no h1 for a
    // screen reader, and no intro on screen either.
    render(<AgentPatternsContent />);
    expect(screen.getByRole("heading", { level: 1, name: "AI Agent UI Patterns" })).toBeVisible();
    expect(screen.getByText(/Interactive demos of the streaming/)).toBeVisible();
  });
});
