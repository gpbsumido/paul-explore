import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "@/test/a11y";
import AdminBackLink from "./AdminBackLink";

describe("AdminBackLink", () => {
  it("links back to the ZeroProof lobby and names the current panel", () => {
    render(<AdminBackLink current="Bets" />);
    const back = screen.getByRole("link", { name: /zeroproof/i });
    expect(back).toHaveAttribute("href", "/zeroproof");
    expect(screen.getByText("Bets")).toBeInTheDocument();
  });

  it("exposes a breadcrumb navigation landmark", () => {
    render(<AdminBackLink current="Bets" />);
    expect(
      screen.getByRole("navigation", { name: /breadcrumb/i }),
    ).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    const { container } = render(<AdminBackLink current="Ingest health" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
