import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EconomyHealthDemo from "../economy-health";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("economy-health")!];

describe("economy health demo", () => {
  it("shows the economy KPI grid and the faucet/sink chart", () => {
    render(<EconomyHealthDemo feature={feature} />);
    expect(screen.getByText("Net supply")).toBeInTheDocument();
    expect(screen.getByText("Sink ratio")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Faucet versus sink chart"),
    ).toBeInTheDocument();
  });
});
