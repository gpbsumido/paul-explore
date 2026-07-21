import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
import CommunityModeDemo from "../community-mode";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("community-mode")!];

afterEach(() => vi.useRealTimers());

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

  it("opens per-post analytics on click", () => {
    render(<CommunityModeDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "Analytics for novaqueen" }));
    const dialog = screen.getByRole("dialog", { name: "Analytics for novaqueen" });
    expect(within(dialog).getByText("Likes")).toBeInTheDocument();
    expect(within(dialog).getByText("Replies")).toBeInTheDocument();
    expect(within(dialog).getByText("Likes over time")).toBeInTheDocument();
  });

  it("ticks likes up live on an interval", () => {
    vi.useFakeTimers();
    render(<CommunityModeDemo feature={feature} />);
    const total = () =>
      Number(
        screen.getByText(/total likes/).textContent!.match(/[\d,]+/)![0].replace(
          /,/g,
          "",
        ),
      );
    const before = total();
    act(() => vi.advanceTimersByTime(2100));
    expect(total()).toBeGreaterThan(before);
  });
});
