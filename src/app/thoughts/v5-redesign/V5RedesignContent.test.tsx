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

  it("closes with the standing what-next block every write-up carries", () => {
    render(<V5RedesignContent />);
    expect(
      screen.getByRole("heading", { name: /What I'd do now/i }),
    ).toBeInTheDocument();
  });
});
