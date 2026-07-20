import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CommunityModeDemo from "../community-mode";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("community-mode")!];

describe("community mode demo", () => {
  it("bumps a post's like count when liked", () => {
    render(<CommunityModeDemo feature={feature} />);
    const before = Number(screen.getByTestId("likes-1").textContent!.replace(/,/g, ""));
    fireEvent.click(screen.getByRole("button", { name: "Like novaqueen" }));
    const after = Number(screen.getByTestId("likes-1").textContent!.replace(/,/g, ""));
    expect(after).toBe(before + 1);
  });
});
