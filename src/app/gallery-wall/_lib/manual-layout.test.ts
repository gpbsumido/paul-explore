import { describe, it, expect } from "vitest";
import {
  galleryReducer,
  initialGalleryState,
  computePlacements,
  computeValidation,
  type GalleryState,
} from "./state";
import { frameDimensions } from "./frames";

const withImages = (): GalleryState =>
  galleryReducer(
    { ...initialGalleryState, wall: { width: 100, height: 100 } },
    {
      type: "add-images",
      images: [
        { id: "a", src: "blob:a", aspect: 0.8 },
        { id: "b", src: "blob:b", aspect: 0.8 },
      ],
    },
  );

const placementFor = (state: GalleryState, id: string) =>
  computePlacements(state).find((p) => p.id === id)!;

describe("computePlacements", () => {
  it("auto-arranges images that have no manual position", () => {
    const placements = computePlacements(withImages());
    expect(placements).toHaveLength(2);
    // Auto layout never overlaps, so a fresh add is valid.
    expect(computeValidation(withImages()).overlaps).toEqual([]);
  });

  it("honours a manual position once a frame is moved", () => {
    const state = galleryReducer(withImages(), {
      type: "move-image",
      id: "a",
      x: 12,
      y: 34,
    });
    const placed = placementFor(state, "a");
    expect(placed.x).toBeCloseTo(12, 5);
    expect(placed.y).toBeCloseTo(34, 5);
  });
});

describe("move-image", () => {
  it("clamps a frame so it stays on the wall", () => {
    const state = galleryReducer(withImages(), {
      type: "move-image",
      id: "a",
      x: 999,
      y: -50,
    });
    const placed = placementFor(state, "a");
    const dims = frameDimensions(state.images[0].frame);
    expect(placed.x).toBeCloseTo(state.wall.width - dims.width, 5);
    expect(placed.y).toBeCloseTo(0, 5);
  });

  it("freezes the other frames in place so they don't jump when one is dragged", () => {
    const before = withImages();
    const beforeB = computePlacements(before).find((p) => p.id === "b")!;
    const after = galleryReducer(before, {
      type: "move-image",
      id: "a",
      x: 0,
      y: 0,
    });
    // b keeps its exact auto position even though a moved.
    expect(after.images.find((i) => i.id === "b")?.position).toEqual({
      x: beforeB.x,
      y: beforeB.y,
    });
  });

  it("does not mutate the previous state", () => {
    const before = withImages();
    galleryReducer(before, { type: "move-image", id: "a", x: 5, y: 5 });
    expect(before.images.every((i) => i.position === undefined)).toBe(true);
  });
});

describe("auto-arrange", () => {
  it("clears manual positions so the tidy layout returns", () => {
    const moved = galleryReducer(withImages(), {
      type: "move-image",
      id: "a",
      x: 0,
      y: 0,
    });
    const tidy = galleryReducer(moved, { type: "auto-arrange" });
    expect(tidy.images.every((i) => i.position === undefined)).toBe(true);
    expect(computeValidation(tidy).overlaps).toEqual([]);
  });
});

describe("changing a frame keeps it on the wall", () => {
  it("clamps a moved frame's position when its size grows", () => {
    const moved = galleryReducer(withImages(), {
      type: "move-image",
      id: "a",
      x: 92,
      y: 92,
    });
    const bigger = galleryReducer(moved, {
      type: "set-frame-size",
      id: "a",
      sizeId: "24x36",
    });
    const placed = placementFor(bigger, "a");
    const dims = frameDimensions(bigger.images[0].frame);
    expect(placed.x).toBeLessThanOrEqual(bigger.wall.width - dims.width + 1e-6);
    expect(placed.y).toBeLessThanOrEqual(
      bigger.wall.height - dims.height + 1e-6,
    );
  });
});

describe("computeValidation", () => {
  it("flags overlapping frames and blocks saving", () => {
    let state = galleryReducer(withImages(), {
      type: "move-image",
      id: "a",
      x: 10,
      y: 10,
    });
    state = galleryReducer(state, {
      type: "move-image",
      id: "b",
      x: 12,
      y: 12,
    });
    const validation = computeValidation(state);
    expect(new Set(validation.overlaps)).toEqual(new Set(["a", "b"]));
    expect(validation.invalidIds).toContain("a");
    expect(validation.canSave).toBe(false);
  });

  it("allows saving a valid, non-empty arrangement", () => {
    const validation = computeValidation(withImages());
    expect(validation.invalidIds).toEqual([]);
    expect(validation.canSave).toBe(true);
  });

  it("never allows saving an empty wall", () => {
    expect(computeValidation(initialGalleryState).canSave).toBe(false);
  });
});
