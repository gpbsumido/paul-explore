import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "@/test/a11y";
import SpotlightCard from "./SpotlightCard";

describe("SpotlightCard", () => {
  it("renders its children", () => {
    render(
      <SpotlightCard>
        <p>Verdigris and ember</p>
      </SpotlightCard>,
    );
    expect(screen.getByText("Verdigris and ember")).toBeInTheDocument();
  });

  it("keeps interactive children reachable", () => {
    render(
      <SpotlightCard>
        <a href="/discover">Discover</a>
      </SpotlightCard>,
    );
    expect(screen.getByRole("link", { name: "Discover" })).toHaveAttribute(
      "href",
      "/discover",
    );
  });

  it("caps the glow alpha so an accent can never bury the copy above it", () => {
    // The DS glow gradient expects a low-alpha colour (its default ships at
    // 25%). Handing it a raw token painted a full-strength wash under muted
    // text on the contact card, unreadable at the exact moment of hover, and
    // no axe pass can see it: jsdom computes no contrast, and the e2e sweep
    // scans the resting state where the glow is transparent. The cap lives in
    // this wrapper so every card is copy-safe by construction.
    const { container } = render(
      <SpotlightCard accent="var(--color-secondary-500)">
        <p>copy</p>
      </SpotlightCard>,
    );
    const style = container.firstElementChild?.getAttribute("style") ?? "";
    expect(style).toContain("--paul-spotlight-color");
    expect(style).toMatch(/color-mix\(in srgb, var\(--color-secondary-500\) 2\d%, transparent\)/);
  });

  it("tints from the accent it is given", () => {
    const { container } = render(
      <SpotlightCard accent="var(--color-feature-craft)">
        <p>Craft</p>
      </SpotlightCard>,
    );
    expect(container.innerHTML).toContain("--color-feature-craft");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <SpotlightCard>
        <p>Verdigris and ember</p>
      </SpotlightCard>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
