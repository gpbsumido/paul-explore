import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EvarSizingContent from "./EvarSizingContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("EvarSizingContent", () => {
  it("renders the write-up heading", () => {
    render(<EvarSizingContent />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("links to the practice page it writes up", () => {
    render(<EvarSizingContent />);
    expect(
      screen.getAllByRole("link", { name: /evar sizing/i })[0],
    ).toHaveAttribute("href", "/evar");
  });

  it("has a dated update on the difficulty levels", () => {
    render(<EvarSizingContent />);
    expect(screen.getAllByText(/update.*october 22, 2026/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { level: 2, name: /five minutes/i }),
    ).toBeInTheDocument();
  });

  it("has a dated update on picking the device", () => {
    render(<EvarSizingContent />);
    expect(
      screen.getByRole("heading", { level: 2, name: /16 mm limb/i }),
    ).toBeInTheDocument();
  });

  it("has a dated update on recording attempts for the study", () => {
    render(<EvarSizingContent />);
    expect(
      screen.getByRole("heading", { level: 2, name: /recorded once/i }),
    ).toBeInTheDocument();
  });

  it("has a dated update on correcting reference answers", () => {
    render(<EvarSizingContent />);
    expect(
      screen.getByRole("heading", { level: 2, name: /without a deploy/i }),
    ).toBeInTheDocument();
  });

  it("closes with what shipped and what is next", () => {
    render(<EvarSizingContent />);
    expect(
      screen.getByRole("heading", { name: /what I'd do now/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /next on this/i }),
    ).toBeInTheDocument();
  });
});
