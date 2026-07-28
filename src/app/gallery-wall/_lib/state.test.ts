import { describe, it, expect } from "vitest";
import {
  galleryReducer,
  initialGalleryState,
  computeArrangement,
  type GalleryState,
} from "./state";

const withImages = (): GalleryState =>
  galleryReducer(initialGalleryState, {
    type: "add-images",
    images: [
      { id: "img-1", src: "blob:1", aspect: 0.7 },
      { id: "img-2", src: "blob:2", aspect: 1.6 },
    ],
  });

describe("galleryReducer", () => {
  it("starts with no images and a sensible default wall", () => {
    expect(initialGalleryState.images).toEqual([]);
    expect(initialGalleryState.wall.width).toBeGreaterThan(0);
    expect(initialGalleryState.wall.height).toBeGreaterThan(0);
  });

  it("adds images and auto-assigns a frame to each", () => {
    const state = withImages();
    expect(state.images).toHaveLength(2);
    expect(state.images[0].frame.orientation).toBe("portrait");
    expect(state.images[1].frame.orientation).toBe("landscape");
  });

  it("appends rather than replaces when more images are added", () => {
    const state = galleryReducer(withImages(), {
      type: "add-images",
      images: [{ id: "img-3", src: "blob:3", aspect: 1 }],
    });
    expect(state.images.map((i) => i.id)).toEqual(["img-1", "img-2", "img-3"]);
  });

  it("removes an image by id", () => {
    const state = galleryReducer(withImages(), {
      type: "remove-image",
      id: "img-1",
    });
    expect(state.images.map((i) => i.id)).toEqual(["img-2"]);
  });

  it("changes a single image's frame size without touching the others", () => {
    const state = galleryReducer(withImages(), {
      type: "set-frame-size",
      id: "img-1",
      sizeId: "16x20",
    });
    expect(state.images[0].frame.sizeId).toBe("16x20");
    expect(state.images[1].frame.sizeId).toBe(withImages().images[1].frame.sizeId);
  });

  it("changes a single image's orientation", () => {
    const state = galleryReducer(withImages(), {
      type: "set-orientation",
      id: "img-1",
      orientation: "landscape",
    });
    expect(state.images[0].frame.orientation).toBe("landscape");
  });

  it("updates the wall dimensions", () => {
    const state = galleryReducer(initialGalleryState, {
      type: "set-wall",
      width: 120,
      height: 80,
    });
    expect(state.wall).toEqual({ width: 120, height: 80 });
  });

  it("clamps wall dimensions to a positive minimum", () => {
    const state = galleryReducer(initialGalleryState, {
      type: "set-wall",
      width: 0,
      height: -5,
    });
    expect(state.wall.width).toBeGreaterThan(0);
    expect(state.wall.height).toBeGreaterThan(0);
  });

  it("does not mutate the previous state", () => {
    const before = withImages();
    const snapshot = before.images.length;
    galleryReducer(before, { type: "remove-image", id: "img-1" });
    expect(before.images).toHaveLength(snapshot);
  });
});

describe("computeArrangement", () => {
  it("turns framed images into placements sized in the wall's unit", () => {
    const state = galleryReducer(
      { ...initialGalleryState, wall: { width: 100, height: 100 } },
      {
        type: "add-images",
        images: [{ id: "only", src: "blob:x", aspect: 0.8 }],
      },
    );
    const arrangement = computeArrangement(state);
    expect(arrangement.placements).toHaveLength(1);
    const placed = arrangement.placements[0];
    expect(placed.id).toBe("only");
    expect(placed.width).toBeGreaterThan(0);
    expect(placed.height).toBeGreaterThan(0);
  });

  it("reports overflow when frames are too big for the wall", () => {
    const state = galleryReducer(
      { ...initialGalleryState, wall: { width: 5, height: 5 } },
      {
        type: "add-images",
        images: [{ id: "big", src: "blob:x", aspect: 0.8 }],
      },
    );
    expect(computeArrangement(state).overflows).toBe(true);
  });
});
