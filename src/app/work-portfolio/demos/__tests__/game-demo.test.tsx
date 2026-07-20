import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GameDemoFrame from "../game-demo";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("game-demo")!];

describe("game demo frame", () => {
  it("starts the faux game from the start screen", () => {
    render(<GameDemoFrame feature={feature} />);
    expect(screen.getByRole("button", { name: "▶ Start demo" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "▶ Start demo" }));
    expect(screen.getByText(/running WebGL scene/)).toBeInTheDocument();
  });
});
