import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import CommunityModeDemo from "../community-mode";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("community-mode")!];

describe("community mode demo", () => {
  it("bumps a post's like count when liked", () => {
    render(<CommunityModeDemo feature={feature} />);
    const before = Number(
      screen.getByTestId("likes-1").textContent!.replace(/,/g, ""),
    );
    fireEvent.click(screen.getByRole("button", { name: "Like novaqueen" }));
    const after = Number(
      screen.getByTestId("likes-1").textContent!.replace(/,/g, ""),
    );
    expect(after).toBe(before + 1);
  });

  it("adds a new post from the composer", () => {
    render(<CommunityModeDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "New post" }));
    fireEvent.change(screen.getByLabelText("Body"), {
      target: { value: "just queued up for ranked" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Post" }));
    expect(
      within(screen.getByRole("list", { name: "Feed" })).getByText(
        "just queued up for ranked",
      ),
    ).toBeInTheDocument();
  });

  it("adds a reply to a post", () => {
    render(<CommunityModeDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "Reply to novaqueen" }));
    fireEvent.change(screen.getByLabelText("Body"), {
      target: { value: "huge congrats" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reply" }));
    expect(screen.getByText("huge congrats")).toBeInTheDocument();
  });
});
