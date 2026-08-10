import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import LearnContent from "./LearnContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("LearnContent", () => {
  it("renders the write-up heading", () => {
    render(<LearnContent />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("carries a timeline that jumps to its dated updates", () => {
    const { container } = render(<LearnContent />);
    const nav = screen.getByRole("navigation", { name: /update timeline/i });
    const link = within(nav).getAllByRole("link")[0];
    const href = link.getAttribute("href") ?? "";
    expect(href.startsWith("#update-")).toBe(true);
    expect(container.querySelector(href)).not.toBeNull();
  });

  it("closes with what shipped and what is next", () => {
    render(<LearnContent />);
    expect(
      screen.getByRole("heading", { name: /what I'd do now/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /next on this/i }),
    ).toBeInTheDocument();
  });
});
