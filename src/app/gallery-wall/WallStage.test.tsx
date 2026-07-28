import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import WallStage from "./WallStage";
import type { FramedImage } from "./_lib/state";
import { computeArrangement } from "./_lib/state";

const images: FramedImage[] = [
  {
    id: "a",
    src: "blob:a",
    aspect: 0.8,
    frame: { sizeId: "8x10", orientation: "portrait" },
  },
  {
    id: "b",
    src: "blob:b",
    aspect: 1.5,
    frame: { sizeId: "11x14", orientation: "landscape" },
  },
];

const wall = { width: 96, height: 60 };
const arrangement = computeArrangement({ images, wall, gap: 3 });

describe("WallStage", () => {
  it("exposes the preview as a labelled image region", () => {
    render(<WallStage wall={wall} placements={arrangement.placements} images={images} />);
    const region = screen.getByRole("img", { name: /wall/i });
    expect(region).toBeInTheDocument();
  });

  it("scales the viewBox to the physical wall size", () => {
    const { container } = render(
      <WallStage wall={wall} placements={arrangement.placements} images={images} />,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 96 60");
  });

  it("renders one photo per placed frame", () => {
    const { container } = render(
      <WallStage wall={wall} placements={arrangement.placements} images={images} />,
    );
    const photos = container.querySelectorAll("image");
    expect(photos).toHaveLength(2);
    const hrefs = Array.from(photos).map((p) => p.getAttribute("href"));
    expect(hrefs).toEqual(["blob:a", "blob:b"]);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <WallStage wall={wall} placements={arrangement.placements} images={images} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
