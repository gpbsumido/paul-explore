import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import PostQueueDemo, { movePost } from "../post-queue";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("post-queue")!];

describe("post queue kanban demo", () => {
  it("moves a post to the next column with the move button", () => {
    const { container } = render(<PostQueueDemo feature={feature} />);
    const card = () => container.querySelector('[data-post="1"]');
    expect(card()?.getAttribute("data-column")).toBe("Scheduled");

    fireEvent.click(
      screen.getByRole("button", { name: "Move Patch 4.1 recap right" }),
    );
    expect(card()?.getAttribute("data-column")).toBe("Published");
  });

  it("groups posts under their columns", () => {
    render(<PostQueueDemo feature={feature} />);
    expect(
      within(screen.getByRole("list", { name: "Backlog" })).getByText(
        "Weekend 2x XP",
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "Published" })).getByText(
        "Dev livestream teaser",
      ),
    ).toBeInTheDocument();
  });

  it("labels each card with its scheduled day", () => {
    render(<PostQueueDemo feature={feature} />);
    const card = screen.getByText("Community art roundup");
    expect(within(card).getByText("Wed")).toBeInTheDocument();
  });

  it("edits a post's title through the card modal", () => {
    render(<PostQueueDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit Patch 4.1 recap" }));

    const titleField = screen.getByLabelText("Title");
    fireEvent.change(titleField, { target: { value: "Patch 4.1 highlights" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Patch 4.1 highlights")).toBeInTheDocument();
  });

  it("movePost only changes the targeted post's column", () => {
    const posts = [
      { id: 1, title: "a", day: 0, column: "Backlog" as const },
      { id: 2, title: "b", day: 1, column: "Scheduled" as const },
    ];
    const next = movePost(posts, 1, "Published");
    expect(next[0].column).toBe("Published");
    expect(next[1].column).toBe("Scheduled");
  });
});
