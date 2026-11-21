import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
const arrangement = computeArrangement({
  images,
  wall,
  gap: 3,
  layout: "rows",
});
const placementFor = (id: string) =>
  arrangement.placements.find((p) => p.id === id)!;

describe("WallStage", () => {
  it("exposes the preview as a labelled image region", () => {
    render(
      <WallStage
        wall={wall}
        placements={arrangement.placements}
        images={images}
      />,
    );
    expect(
      screen.getByRole("img", {
        name: "Gallery wall preview: 2 frames on a 96 by 60 inch wall",
      }),
    ).toBeInTheDocument();
  });

  it("says so when the wall is empty, and uses the singular for one frame", () => {
    const { rerender } = render(<WallStage wall={wall} placements={[]} images={[]} />);
    expect(screen.getByRole("img", { name: "Empty 96 by 60 inch wall" })).toBeInTheDocument();

    rerender(
      <WallStage wall={wall} placements={[placementFor("a")]} images={images} />,
    );
    expect(
      screen.getByRole("img", { name: "Gallery wall preview: 1 frame on a 96 by 60 inch wall" }),
    ).toBeInTheDocument();
  });

  it("scales the viewBox to the physical wall size", () => {
    const { container } = render(
      <WallStage
        wall={wall}
        placements={arrangement.placements}
        images={images}
      />,
    );
    expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe(
      "0 0 96 60",
    );
  });

  it("renders one photo per placed frame", () => {
    const { container } = render(
      <WallStage
        wall={wall}
        placements={arrangement.placements}
        images={images}
      />,
    );
    const photos = container.querySelectorAll("image");
    expect(photos).toHaveLength(2);
    expect(Array.from(photos).map((p) => p.getAttribute("href"))).toEqual([
      "blob:a",
      "blob:b",
    ]);
  });

  it("marks the frames named as invalid", () => {
    const { container } = render(
      <WallStage
        wall={wall}
        placements={arrangement.placements}
        images={images}
        invalidIds={["a"]}
      />,
    );
    const a = container.querySelector('[data-frame-id="a"]');
    const b = container.querySelector('[data-frame-id="b"]');
    expect(a?.getAttribute("data-invalid")).toBe("true");
    expect(b?.getAttribute("data-invalid")).toBe("false");
  });

  it("has no static button when it is not interactive", () => {
    render(
      <WallStage
        wall={wall}
        placements={arrangement.placements}
        images={images}
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("exposes each frame as a keyboard-movable control when onMove is given", () => {
    const onMove = vi.fn();
    render(
      <WallStage
        wall={wall}
        placements={arrangement.placements}
        images={images}
        onMove={onMove}
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(2);
    expect(buttons[0]).toHaveAttribute("tabindex", "0");
  });

  it("nudges a frame right by one inch on ArrowRight", () => {
    const onMove = vi.fn();
    const { container } = render(
      <WallStage
        wall={wall}
        placements={arrangement.placements}
        images={images}
        onMove={onMove}
      />,
    );
    const a = container.querySelector('[data-frame-id="a"]')!;
    fireEvent.keyDown(a, { key: "ArrowRight" });
    const start = placementFor("a");
    expect(onMove).toHaveBeenCalledWith("a", {
      x: start.x + 1,
      y: start.y,
    });
  });

  it("nudges one inch in each of the other three directions", () => {
    const onMove = vi.fn();
    const { container } = render(
      <WallStage
        wall={wall}
        placements={arrangement.placements}
        images={images}
        onMove={onMove}
      />,
    );
    const a = container.querySelector('[data-frame-id="a"]')!;
    const start = placementFor("a");
    fireEvent.keyDown(a, { key: "ArrowLeft" });
    expect(onMove).toHaveBeenLastCalledWith("a", { x: start.x - 1, y: start.y });
    fireEvent.keyDown(a, { key: "ArrowUp" });
    expect(onMove).toHaveBeenLastCalledWith("a", { x: start.x, y: start.y - 1 });
    fireEvent.keyDown(a, { key: "ArrowDown" });
    expect(onMove).toHaveBeenLastCalledWith("a", { x: start.x, y: start.y + 1 });
  });

  it("leaves other keys alone", () => {
    const onMove = vi.fn();
    const { container } = render(
      <WallStage
        wall={wall}
        placements={arrangement.placements}
        images={images}
        onMove={onMove}
      />,
    );
    const a = container.querySelector('[data-frame-id="a"]')!;
    expect(fireEvent.keyDown(a, { key: "Enter" })).toBe(true);
    expect(onMove).not.toHaveBeenCalled();
  });

  it("drags a frame by the pointer, scaled from screen pixels to wall inches", () => {
    const onMove = vi.fn();
    const { container } = render(
      <WallStage
        wall={wall}
        placements={arrangement.placements}
        images={images}
        onMove={onMove}
      />,
    );
    // jsdom has no layout or pointer capture, so give the svg a size (10px per
    // inch) and let the frame accept a capture.
    const svg = container.querySelector("svg")!;
    svg.getBoundingClientRect = () =>
      ({ width: 960, height: 600, top: 0, left: 0, right: 960, bottom: 600, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    const a = container.querySelector('[data-frame-id="a"]')! as SVGGElement;
    a.setPointerCapture = vi.fn();
    a.releasePointerCapture = vi.fn();
    const start = placementFor("a");

    fireEvent.pointerDown(a, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(a, { clientX: 150, clientY: 120, pointerId: 1 });
    expect(onMove).toHaveBeenLastCalledWith("a", { x: start.x + 5, y: start.y + 2 });

    fireEvent.pointerUp(a, { clientX: 150, clientY: 120, pointerId: 1 });
    onMove.mockClear();
    fireEvent.pointerMove(a, { clientX: 400, clientY: 400, pointerId: 1 });
    expect(onMove).not.toHaveBeenCalled();
  });

  it("ignores pointer movement that did not start on a frame", () => {
    const onMove = vi.fn();
    const { container } = render(
      <WallStage
        wall={wall}
        placements={arrangement.placements}
        images={images}
        onMove={onMove}
      />,
    );
    const a = container.querySelector('[data-frame-id="a"]')!;
    fireEvent.pointerMove(a, { clientX: 150, clientY: 120, pointerId: 1 });
    expect(onMove).not.toHaveBeenCalled();
  });

  it("takes a bigger step with Shift held", () => {
    const onMove = vi.fn();
    const { container } = render(
      <WallStage
        wall={wall}
        placements={arrangement.placements}
        images={images}
        onMove={onMove}
      />,
    );
    const a = container.querySelector('[data-frame-id="a"]')!;
    fireEvent.keyDown(a, { key: "ArrowDown", shiftKey: true });
    const start = placementFor("a");
    expect(onMove).toHaveBeenCalledWith("a", { x: start.x, y: start.y + 5 });
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <WallStage
        wall={wall}
        placements={arrangement.placements}
        images={images}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations while interactive", async () => {
    const { container } = render(
      <WallStage
        wall={wall}
        placements={arrangement.placements}
        images={images}
        onMove={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
