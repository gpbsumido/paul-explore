/**
 * Standard picture-frame sizes and the logic that auto-picks the best frame for
 * an image. Everything here is pure and unit-agnostic, measured in inches to
 * match the way frames are actually sold. The wall preview does the pixel
 * scaling; this module only reasons about physical proportions.
 */

export type Orientation = "portrait" | "landscape";

/** A standard frame size, stored short side first so orientation can swap it. */
export type FrameSize = {
  /** Stable id used in state and controls. */
  id: string;
  /** Human label, e.g. "8 × 10". */
  label: string;
  /** Shorter physical side, in inches. */
  short: number;
  /** Longer physical side, in inches. */
  long: number;
};

/** A frame choice: which size, and which way up. */
export type Frame = { sizeId: string; orientation: Orientation };

/** Physical width and height of a placed frame, in inches. */
export type FrameDimensions = { width: number; height: number };

/**
 * Common off-the-shelf frame sizes, short side first and sorted by area so the
 * size dropdown reads small to large.
 */
export const FRAME_SIZES: readonly FrameSize[] = [
  { id: "4x6", label: "4 × 6", short: 4, long: 6 },
  { id: "5x7", label: "5 × 7", short: 5, long: 7 },
  { id: "8x10", label: "8 × 10", short: 8, long: 10 },
  { id: "11x14", label: "11 × 14", short: 11, long: 14 },
  { id: "16x20", label: "16 × 20", short: 16, long: 20 },
  { id: "18x24", label: "18 × 24", short: 18, long: 24 },
  { id: "24x36", label: "24 × 36", short: 24, long: 36 },
];

/** The medium fallback used for unknown ids and to break aspect ties. */
export const DEFAULT_FRAME_SIZE_ID = "8x10";

/** Look up a frame size by id. */
export function frameById(id: string): FrameSize | undefined {
  return FRAME_SIZES.find((size) => size.id === id);
}

function sizeOrDefault(id: string): FrameSize {
  return frameById(id) ?? frameById(DEFAULT_FRAME_SIZE_ID)!;
}

/**
 * Resolve a frame choice to its physical width and height. Portrait keeps the
 * short side as the width; landscape swaps so the long side runs horizontally.
 */
export function frameDimensions(frame: Frame): FrameDimensions {
  const size = sizeOrDefault(frame.sizeId);
  return frame.orientation === "landscape"
    ? { width: size.long, height: size.short }
    : { width: size.short, height: size.long };
}

/** The frame's width/height aspect ratio in the given orientation. */
function orientedAspect(size: FrameSize, orientation: Orientation): number {
  return orientation === "landscape"
    ? size.long / size.short
    : size.short / size.long;
}

/**
 * Pick the best frame for an image given its width/height aspect ratio.
 *
 * Orientation follows the image: wider-than-tall goes landscape, otherwise
 * portrait (squares included). The size is the one whose oriented aspect ratio
 * sits closest to the image, and ties are broken toward the medium default so a
 * standard 8×10-shaped photo lands on an 8×10 rather than the largest match.
 */
export function chooseBestFrame(imageAspect: number): Frame {
  const orientation: Orientation = imageAspect > 1 ? "landscape" : "portrait";
  const defaultArea = (() => {
    const d = frameById(DEFAULT_FRAME_SIZE_ID)!;
    return d.short * d.long;
  })();

  const best = [...FRAME_SIZES]
    .map((size) => ({
      size,
      aspectDiff: Math.abs(orientedAspect(size, orientation) - imageAspect),
      areaDiff: Math.abs(size.short * size.long - defaultArea),
    }))
    .sort((a, b) => a.aspectDiff - b.aspectDiff || a.areaDiff - b.areaDiff)[0];

  return { sizeId: best.size.id, orientation };
}
