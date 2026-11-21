import { describe, it, expect } from "vitest";
import {
  galleryReducer,
  initialGalleryState,
  computeArrangement,
  computePlacements,
  computeValidation,
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
    expect(state.images[1].frame.sizeId).toBe(
      withImages().images[1].frame.sizeId,
    );
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

describe("galleryReducer spacing and dragging", () => {
  const placementOf = (state: GalleryState, id: string) =>
    computePlacements(state).find((p) => p.id === id)!;

  it("sets the gap between frames", () => {
    const state = galleryReducer(initialGalleryState, {
      type: "set-gap",
      gap: 5,
    });
    expect(state.gap).toBe(5);
  });

  it("never lets the gap go below zero", () => {
    const state = galleryReducer(initialGalleryState, {
      type: "set-gap",
      gap: -4,
    });
    expect(state.gap).toBe(0);
  });

  it("moves the dragged frame and leaves the others where they were", () => {
    const before = withImages();
    const moved = galleryReducer(before, {
      type: "move-image",
      id: "img-2",
      x: 5,
      y: 6,
    });
    expect(placementOf(moved, "img-2")).toMatchObject({ x: 5, y: 6 });
    expect(placementOf(moved, "img-1")).toEqual(placementOf(before, "img-1"));
  });

  it("keeps a dragged frame on the wall, however far it is thrown", () => {
    // img-2 is landscape 14 x 11 on a 76 x 60 wall.
    const far = galleryReducer(withImages(), {
      type: "move-image",
      id: "img-2",
      x: 1000,
      y: 1000,
    });
    expect(placementOf(far, "img-2")).toMatchObject({ x: 62, y: 49 });

    const behind = galleryReducer(withImages(), {
      type: "move-image",
      id: "img-2",
      x: -30,
      y: -30,
    });
    expect(placementOf(behind, "img-2")).toMatchObject({ x: 0, y: 0 });
  });

  it("pulls a dragged frame back onto the wall when it grows past the edge", () => {
    const parked = galleryReducer(withImages(), {
      type: "move-image",
      id: "img-1",
      x: 1000,
      y: 0,
    });
    const grown = galleryReducer(parked, {
      type: "set-frame-size",
      id: "img-1",
      sizeId: "24x36",
    });
    // A portrait 24 x 36 frame has to start at 76 - 24 to stay on the wall.
    expect(placementOf(grown, "img-1").x).toBe(52);
  });

  it("drops manual positions on auto-arrange and keeps the layout unless told otherwise", () => {
    const dragged = galleryReducer(
      galleryReducer(withImages(), {
        type: "set-layout",
        layout: "masonry",
      }),
      { type: "move-image", id: "img-1", x: 9, y: 9 },
    );
    const same = galleryReducer(dragged, { type: "auto-arrange" });
    expect(same.layout).toBe("masonry");
    expect(same.images.every((i) => i.position === undefined)).toBe(true);

    const switched = galleryReducer(dragged, {
      type: "auto-arrange",
      layout: "aesthetic",
    });
    expect(switched.layout).toBe("aesthetic");
  });
});

describe("computeValidation", () => {
  it("cannot save an empty wall", () => {
    expect(computeValidation(initialGalleryState).canSave).toBe(false);
  });

  it("can save frames that fit without touching", () => {
    const validation = computeValidation(withImages());
    expect(validation.invalidIds).toEqual([]);
    expect(validation.canSave).toBe(true);
  });

  it("flags both frames of an overlap and blocks saving", () => {
    const stacked = galleryReducer(
      galleryReducer(withImages(), {
        type: "move-image",
        id: "img-1",
        x: 0,
        y: 0,
      }),
      { type: "move-image", id: "img-2", x: 1, y: 1 },
    );
    const validation = computeValidation(stacked);
    expect([...validation.overlaps].sort()).toEqual(["img-1", "img-2"]);
    expect(validation.invalidIds.sort()).toEqual(["img-1", "img-2"]);
    expect(validation.canSave).toBe(false);
  });

  it("flags a frame that hangs off the wall and blocks saving", () => {
    const state = galleryReducer(
      { ...initialGalleryState, wall: { width: 10, height: 10 } },
      {
        type: "add-images",
        images: [{ id: "big", src: "blob:x", aspect: 0.7 }],
      },
    );
    const validation = computeValidation(state);
    expect(validation.outOfBounds).toEqual(["big"]);
    expect(validation.canSave).toBe(false);
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

  it("sizes the content to the lowest frame and stays quiet when all of it fits", () => {
    const state = galleryReducer(
      { ...initialGalleryState, wall: { width: 100, height: 100 } },
      {
        type: "add-images",
        images: [{ id: "only", src: "blob:x", aspect: 0.7 }],
      },
    );
    const arrangement = computeArrangement(state);
    const placed = arrangement.placements[0];
    expect(arrangement.contentHeight).toBe(placed.y + placed.height);
    expect(arrangement.overflows).toBe(false);
  });
});
