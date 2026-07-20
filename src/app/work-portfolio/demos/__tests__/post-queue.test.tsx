import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import PostQueueDemo from "../post-queue";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("post-queue")!];

describe("post queue demo", () => {
  it("reorders posts with the move buttons", () => {
    const { container } = render(<PostQueueDemo feature={feature} />);
    const order = () =>
      Array.from(container.querySelectorAll("[data-post]")).map((el) =>
        el.getAttribute("data-post"),
      );
    expect(order()[0]).toBe("1");
    fireEvent.click(screen.getByRole("button", { name: "Move Patch 4.1 recap down" }));
    expect(order()[0]).toBe("2");
  });

  it("shows the week strip", () => {
    render(<PostQueueDemo feature={feature} />);
    const first = screen.getByText("Community art roundup");
    expect(within(first).getByText("Wed")).toBeInTheDocument();
  });
});
