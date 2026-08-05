import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RefactorPassContent from "./RefactorPassContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("RefactorPassContent", () => {
  it("renders the write-up heading", () => {
    render(<RefactorPassContent />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "A maintainability refactor pass",
      }),
    ).toBeInTheDocument();
  });

  it("links to the companion project-review write-up it builds on", () => {
    render(<RefactorPassContent />);
    const links = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(links).toContain("/thoughts/project-review");
  });
});
