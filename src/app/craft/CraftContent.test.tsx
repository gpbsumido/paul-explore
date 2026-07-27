import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import CraftContent from "./CraftContent";
import { CRAFT_TRAITS } from "@/lib/craft";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("CraftContent", () => {
  it("renders every trait as an expandable control", () => {
    render(<CraftContent />);
    for (const trait of CRAFT_TRAITS) {
      expect(
        screen.getByRole("button", { name: new RegExp(trait.title) }),
      ).toBeInTheDocument();
    }
  });

  it("shows every trait's evidence links while expanded", () => {
    render(<CraftContent />);
    const perf = CRAFT_TRAITS.find((t) => t.id === "performance")!;
    for (const ev of perf.evidence) {
      const link = screen.getByRole("link", { name: new RegExp(ev.label) });
      expect(link).toHaveAttribute("href", ev.href);
    }
  });

  it("collapses a trait's panel when its header is clicked", () => {
    render(<CraftContent />);
    const trait = CRAFT_TRAITS[0];
    const header = screen.getByRole("button", {
      name: new RegExp(trait.title),
    });
    expect(header).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(header);

    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("link", { name: new RegExp(trait.evidence[0].label) }),
    ).toBeNull();
  });

  it("collapses and expands the whole set with the bulk toggle", () => {
    render(<CraftContent />);
    const bulk = screen.getByRole("button", { name: "Collapse all" });

    fireEvent.click(bulk);

    for (const trait of CRAFT_TRAITS) {
      expect(
        screen.getByRole("button", { name: new RegExp(trait.title) }),
      ).toHaveAttribute("aria-expanded", "false");
    }

    fireEvent.click(screen.getByRole("button", { name: "Expand all" }));
    for (const trait of CRAFT_TRAITS) {
      expect(
        screen.getByRole("button", { name: new RegExp(trait.title) }),
      ).toHaveAttribute("aria-expanded", "true");
    }
  });

  it("ties each panel to its header for assistive tech", () => {
    render(<CraftContent />);
    const trait = CRAFT_TRAITS[0];
    const header = screen.getByRole("button", {
      name: new RegExp(trait.title),
    });
    const panelId = header.getAttribute("aria-controls")!;
    const panel = document.getElementById(panelId)!;
    expect(panel).toBeInTheDocument();
    expect(
      within(panel).getByRole("link", {
        name: new RegExp(trait.evidence[0].label),
      }),
    ).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<CraftContent />);
    expect(await axe(container)).toHaveNoViolations();
  }, 30000);
});
