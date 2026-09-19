import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { axe } from "@/test/a11y";
import SurpriseContent from "./SurpriseContent";
import { FEATURES } from "@/app/_shared/featureData.data";

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("SurpriseContent", () => {
  it("toggles between a spin view and a list view", () => {
    render(<SurpriseContent />);
    expect(screen.getByRole("radio", { name: "Spin" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "List" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "List" }));
    const list = screen.getByRole("list", { name: /all features/i });
    expect(within(list).getAllByRole("listitem")).toHaveLength(FEATURES.length);
  });

  it("lists every feature, even ones the discover reel leaves out", () => {
    render(<SurpriseContent />);
    fireEvent.click(screen.getByRole("radio", { name: "List" }));
    const list = screen.getByRole("list", { name: /all features/i });
    for (const feature of FEATURES) {
      const matches = within(list).getAllByRole("link", {
        name: new RegExp(escape(feature.title), "i"),
      });
      expect(matches.some((a) => a.getAttribute("href") === feature.href)).toBe(
        true,
      );
    }
  });

  it("reveals a feature you can open from the spin view", () => {
    render(<SurpriseContent />);
    fireEvent.click(screen.getByRole("button", { name: /surprise me/i }));
    const opener = screen.getByRole("link", { name: /take me there/i });
    const hrefs = FEATURES.map((f) => f.href);
    expect(hrefs).toContain(opener.getAttribute("href"));
  });

  it("has no accessibility violations in either view", async () => {
    const { container } = render(<SurpriseContent />);
    expect(await axe(container)).toHaveNoViolations();
    fireEvent.click(screen.getByRole("radio", { name: "List" }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
