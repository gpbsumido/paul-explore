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
