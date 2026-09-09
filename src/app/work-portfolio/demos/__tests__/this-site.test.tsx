import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ThisSiteDemo from "../this-site";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("this-site")!];

describe("this site demo", () => {
  it("lists live links to the real site pages", () => {
    render(<ThisSiteDemo feature={feature} />);

    const operator = screen.getByRole("link", { name: /Operator Dashboard/i });
    expect(operator).toHaveAttribute("href", "/operator");

    const thoughts = screen.getByRole("link", { name: /Dev Thoughts/i });
    expect(thoughts).toHaveAttribute("href", "/thoughts");
  });

  it("points every card at an absolute in-site path", () => {
    render(<ThisSiteDemo feature={feature} />);
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href")).toMatch(/^\/[a-z-]+$/);
    }
  });
});
