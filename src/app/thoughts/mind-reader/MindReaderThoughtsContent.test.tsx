import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MindReaderThoughtsContent from "./MindReaderThoughtsContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("MindReaderThoughtsContent", () => {
  it("renders the write-up heading", () => {
    render(<MindReaderThoughtsContent />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "My first Svelte, inside a Next app",
      }),
    ).toBeInTheDocument();
  });

  it("links to the feature it documents", () => {
    render(<MindReaderThoughtsContent />);
    const links = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(links).toContain("/mind-reader");
  });
});
