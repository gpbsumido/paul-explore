import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  FEATURES,
  FeatureCard,
  FEATURE_TOKEN,
  PREVIEW_MAP,
} from "../featureData";

const evar = FEATURES.find((f) => f.id === "evar")!;
const workPortfolio = FEATURES.find((f) => f.id === "work-portfolio")!;
const world = FEATURES.find((f) => f.id === "world")!;

describe("work-portfolio hub card", () => {
  it("has a preview component registered", () => {
    expect(PREVIEW_MAP["work-portfolio"]).toBeDefined();
  });

  it("renders the dual-ticker preview chips and the card title", () => {
    render(<FeatureCard feature={workPortfolio} prefersReduced={false} />);
    expect(
      screen.getByRole("heading", { name: "Work Portfolio" }),
    ).toBeInTheDocument();
    // the strip renders twice for the seamless loop, so each label appears >= twice
    expect(screen.getAllByText("Content Engine").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Wallet Lookup").length).toBeGreaterThan(0);
  });

  it("still renders under reduced motion", () => {
    render(<FeatureCard feature={workPortfolio} prefersReduced={true} />);
    expect(
      screen.getByRole("heading", { name: "Work Portfolio" }),
    ).toBeInTheDocument();
  });
});

// The data lives in featureData.data.ts while the preview card lives here, so a
// feature can be listed with no card to draw it. These are the two halves.
describe("Explore Toronto hub card", () => {
  it("is listed with a link to the world and its write-up", () => {
    expect(world.href).toBe("/world");
    expect(world.thoughtsHref).toBe("/thoughts/world");
  });

  it("has a preview component and a design token registered", () => {
    expect(PREVIEW_MAP.world).toBeDefined();
    expect(FEATURE_TOKEN.world).toBe("--color-feature-world");
  });

  it("gives the ZeroProof card its own preview and accent, not the fallback", () => {
    // Without these the card renders an empty preview slot and borrows the NBA
    // accent — the hub-card gap.
    expect(PREVIEW_MAP.zeroproof).toBeDefined();
    expect(FEATURE_TOKEN.zeroproof).toBe("--color-feature-zeroproof");
  });

  it("renders the skyline preview and the walk hint", () => {
    render(<FeatureCard feature={world} prefersReduced={false} />);
    expect(
      screen.getByRole("heading", { name: "Explore Toronto" }),
    ).toBeInTheDocument();
    expect(screen.getByText("walk the city")).toBeInTheDocument();
  });
});

describe("FeatureCard links", () => {
  it("opens an external feature in a new tab without leaking the opener", () => {
    render(<FeatureCard feature={evar} prefersReduced={false} />);
    const open = screen.getByRole("link", { name: /Open/ });
    expect(open).toHaveAttribute("href", evar.href);
    expect(open).toHaveAttribute("target", "_blank");
    expect(open).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("opens an internal feature in the same tab", () => {
    render(<FeatureCard feature={world} prefersReduced={false} />);
    const open = screen.getByRole("link", { name: /Open/ });
    expect(open).toHaveAttribute("href", "/world");
    expect(open).not.toHaveAttribute("target");
  });

  it("links About to the write-up only when the feature has one", () => {
    const { rerender } = render(
      <FeatureCard feature={world} prefersReduced={false} />,
    );
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/thoughts/world",
    );

    rerender(
      <FeatureCard
        feature={{ ...world, thoughtsHref: undefined }}
        prefersReduced={false}
      />,
    );
    expect(screen.queryByRole("link", { name: "About" })).toBeNull();
  });
});
