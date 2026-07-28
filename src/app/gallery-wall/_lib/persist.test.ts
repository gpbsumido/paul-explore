import { describe, it, expect } from "vitest";
import {
  galleryReducer,
  initialGalleryState,
  computePlacements,
  computeHangSheet,
  serializeGallery,
  deserializeGallery,
  type GalleryState,
} from "./state";

const withImages = (): GalleryState =>
  galleryReducer(
    { ...initialGalleryState, wall: { width: 100, height: 80 } },
    {
      type: "add-images",
      images: [
        { id: "a", src: "blob:a", aspect: 0.8 },
        { id: "b", src: "blob:b", aspect: 1.6 },
        { id: "c", src: "blob:c", aspect: 1 },
      ],
    },
  );

describe("layout mode", () => {
  it("defaults to the rows layout", () => {
    expect(initialGalleryState.layout).toBe("rows");
  });

  it("switches to masonry and re-tidies (clears manual positions)", () => {
    const moved = galleryReducer(withImages(), {
      type: "move-image",
      id: "a",
      x: 1,
      y: 1,
    });
    const masonry = galleryReducer(moved, {
      type: "set-layout",
      layout: "masonry",
    });
    expect(masonry.layout).toBe("masonry");
    expect(masonry.images.every((i) => i.position === undefined)).toBe(true);
  });

  it("places frames differently under masonry than rows", () => {
    const rows = withImages();
    const masonry = galleryReducer(rows, {
      type: "set-layout",
      layout: "masonry",
    });
    const rowsY = computePlacements(rows)
      .map((p) => p.y)
      .sort((a, b) => a - b);
    const masonryY = computePlacements(masonry)
      .map((p) => p.y)
      .sort((a, b) => a - b);
    expect(masonryY).not.toEqual(rowsY);
  });
});

describe("computeHangSheet", () => {
  it("lists a measured row per frame", () => {
    const sheet = computeHangSheet(withImages());
    expect(sheet).toHaveLength(3);
    const placements = computePlacements(withImages());
    const first = sheet[0];
    const placed = placements.find((p) => p.id === first.id)!;
    // The hook sits at the top-centre of the frame.
    expect(first.hookFromLeft).toBeCloseTo(placed.x + placed.width / 2, 5);
    expect(first.hookFromTop).toBeCloseTo(placed.y + first.hookDrop, 5);
    expect(first.frameTop).toBeCloseTo(placed.y, 5);
    expect(first.label).toBe("Frame 1");
    expect(first.size).toMatch(/×/);
  });

  it("keeps the numbered order of the photo list", () => {
    const sheet = computeHangSheet(withImages());
    expect(sheet.map((r) => r.label)).toEqual(["Frame 1", "Frame 2", "Frame 3"]);
  });
});

describe("serialize / deserialize", () => {
  it("round-trips a gallery through JSON", () => {
    const state = galleryReducer(withImages(), {
      type: "move-image",
      id: "a",
      x: 5,
      y: 6,
    });
    const restored = deserializeGallery(serializeGallery(state));
    expect(restored).toEqual(state);
  });

  it("returns null for junk input", () => {
    expect(deserializeGallery("not json")).toBeNull();
    expect(deserializeGallery(JSON.stringify({ nope: true }))).toBeNull();
  });
});
