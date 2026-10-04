import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import AgentPatternsContent from "./AgentPatternsContent";

describe("AgentPatternsContent", () => {
  it("shows its title and intro rather than rendering them hidden", () => {
    // The intro once spread a variants object onto its section, which turned
    // the variant named "hidden" into the HTML hidden attribute: no h1 for a
    // screen reader, and no intro on screen either.
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ThemeProvider>
          <AgentPatternsContent />
        </ThemeProvider>
      </QueryClientProvider>,
    );
    // getByRole skips anything hidden, so finding the h1 at all is the check;
    // the fade-in itself never finishes in jsdom, so opacity can't be.
    const heading = screen.getByRole("heading", { level: 1, name: "AI Agent UI Patterns" });
    expect(heading.closest("section")).not.toHaveAttribute("hidden");
  });
});
