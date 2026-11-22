import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import V5RedesignContent from "./V5RedesignContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("V5RedesignContent", () => {
  it("renders the write-up heading", () => {
    render(<V5RedesignContent />);
    expect(
      screen.getByRole("heading", { level: 1, name: /V5 Redesign/i }),
    ).toBeInTheDocument();
  });

  it("links to the landing it documents and to the archive it left behind", () => {
    render(<V5RedesignContent />);
    const links = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(links).toContain("/");
    expect(links).toContain("/discover");
  });

  it("points at the design system section the primitives are documented in", () => {
    render(<V5RedesignContent />);
    const links = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(links.some((href) => href?.startsWith("/design-system"))).toBe(true);
  });

  it("records the sideways shelf giving way to showcase rows as a dated update", () => {
    render(<V5RedesignContent />);
    expect(
      screen.getByRole("heading", { level: 2, name: /stopped hijacking the scroll wheel/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /stopped hijacking the scroll wheel/i })).toHaveAttribute(
      "href",
      "#update-2026-11-22-showcase",
    );
  });

  it("records the stack strip, and why it doesn't scroll, as a dated update", () => {
    render(<V5RedesignContent />);
    expect(
      screen.getByRole("heading", { level: 2, name: /named its tools, and kept still/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /named its tools, and kept still/i })).toHaveAttribute(
      "href",
      "#update-2026-11-22-stack",
    );
  });

  it("closes with the standing what-next block every write-up carries", () => {
    render(<V5RedesignContent />);
    expect(
      screen.getByRole("heading", { name: /What I'd do now/i }),
    ).toBeInTheDocument();
  });
});
