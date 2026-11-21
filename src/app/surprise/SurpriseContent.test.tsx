import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { axe } from "@/test/a11y";
import SurpriseContent from "./SurpriseContent";
import { FEATURES } from "@/app/_shared/featureData.data";

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

afterEach(() => vi.restoreAllMocks());

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

  it("lands on a different feature every time, even when the dice repeat the current one", () => {
    // The first roll points at the feature already showing, so it has to roll again.
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValue(0.5);
    render(<SurpriseContent />);
    expect(
      screen.getByRole("heading", { level: 2, name: FEATURES[0].title }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /surprise me/i }));

    const landed = FEATURES[Math.floor(0.5 * FEATURES.length)];
    expect(
      screen.getByRole("heading", { level: 2, name: landed.title }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /take me there/i })).toHaveAttribute(
      "href",
      landed.href,
    );
  });

  it("opens an outside site in a new tab without handing it the opener", () => {
    render(<SurpriseContent />);
    fireEvent.click(screen.getByRole("radio", { name: "List" }));
    const external = FEATURES.filter((f) => /^https?:\/\//.test(f.href));
    expect(external.length).toBeGreaterThan(0);
    const list = screen.getByRole("list", { name: /all features/i });
    for (const feature of external) {
      const link = within(list)
        .getAllByRole("link")
        .find((a) => a.getAttribute("href") === feature.href)!;
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
    }
  });

  it("has no accessibility violations in either view", async () => {
    const { container } = render(<SurpriseContent />);
    expect(await axe(container)).toHaveNoViolations();
    fireEvent.click(screen.getByRole("radio", { name: "List" }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
