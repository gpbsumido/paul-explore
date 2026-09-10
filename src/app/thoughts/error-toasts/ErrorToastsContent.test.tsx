import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorToastsContent from "./ErrorToastsContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("ErrorToastsContent", () => {
  it("renders the write-up heading", () => {
    render(<ErrorToastsContent />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "One place that catches every failed write",
      }),
    ).toBeInTheDocument();
  });

  it("links out to the design system it built the toast in", () => {
    render(<ErrorToastsContent />);
    const links = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(links).toContain("/design-system");
  });
});
