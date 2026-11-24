import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { axe } from "@/test/a11y";
import { featureFor, PHOTO_STACK_IDS } from "./picks";
import AboutBand from "./AboutBand";

/**
 * The About band borrows the photo stack from the reference site, but the
 * photos are the site's own screens: each card is a real app and opens it.
 */
describe("the v6 about band", () => {
  it("is a landmark named by its heading", () => {
    render(<AboutBand />);
    expect(screen.getByRole("region", { name: /years building data-heavy web apps/i })).toBeInTheDocument();
  });

  it("stacks three screens from the site, each opening its app", () => {
    render(<AboutBand />);
    const stack = screen.getByRole("list", { name: "Snapshots from the site" });
    const links = within(stack).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(PHOTO_STACK_IDS.map((id) => featureFor(id).href));
    expect(links.map((link) => link.getAttribute("aria-label"))).toEqual(
      PHOTO_STACK_IDS.map((id) => `Open ${featureFor(id).title}`),
    );
  });

  it("swaps each screen with the theme, like the project rows", () => {
    const { container } = render(<AboutBand />);
    const sources = Array.from(container.querySelectorAll("img"), (img) => img.getAttribute("src") ?? "");
    for (const id of PHOTO_STACK_IDS) {
      expect(sources.some((src) => src.includes(`${id}-light`))).toBe(true);
      expect(sources.some((src) => src.includes(`${id}-dark`))).toBe(true);
    }
  });

  it("has no axe violations", async () => {
    const { container } = render(<AboutBand />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
