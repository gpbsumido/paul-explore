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

/** What a photo gets framed at unless its resolution can't carry it. */
export const DEFAULT_FRAME_SIZE_ID = "11x14";

/**
 * The lowest print resolution worth hanging. 300 DPI is lab quality, but 150
 * still reads clean at arm's length, which is how a wall is actually viewed.
 */
export const MIN_PRINT_DPI = 150;

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

/** Pixel dimensions of the source photo, used to check it can carry a size. */
export type Resolution = { width: number; height: number };

/** True when a photo has the pixels to print at this size and stay sharp. */
export function canPrintAt(size: FrameSize, resolution: Resolution): boolean {
  const shortPx = Math.min(resolution.width, resolution.height);
  const longPx = Math.max(resolution.width, resolution.height);
  return (
    shortPx >= size.short * MIN_PRINT_DPI && longPx >= size.long * MIN_PRINT_DPI
  );
}

/**
 * Pick the frame for a freshly added photo.
 *
 * Everything defaults to the {@link DEFAULT_FRAME_SIZE_ID}, because a wall of
 * mixed sizes is a choice you make deliberately, not one you should have to undo
 * on every upload. The exception is resolution: a photo that would print soft at
 * that size steps down to the largest size it can actually carry at
 * {@link MIN_PRINT_DPI}, rather than being blown up past what it has. With no
 * resolution to go on we take the default and let the person judge it.
 *
 * Orientation still follows the photo: wider than tall goes landscape,
 * otherwise portrait (squares included). Photos are fitted inside their frame
 * rather than cropped, so the size no longer has to match the photo's aspect.
 */
export function chooseBestFrame(
  imageAspect: number,
  resolution?: Resolution,
): Frame {
  const orientation: Orientation = imageAspect > 1 ? "landscape" : "portrait";
  const preferred = frameById(DEFAULT_FRAME_SIZE_ID)!;

  if (!resolution || resolution.width <= 0 || resolution.height <= 0) {
    return { sizeId: preferred.id, orientation };
  }

  // Never upsize past the default, only step down from it.
  const candidates = FRAME_SIZES.filter(
    (size) => size.short * size.long <= preferred.short * preferred.long,
  );
  const affordable = [...candidates]
    .reverse()
    .find((size) => canPrintAt(size, resolution));

  return {
    sizeId: (affordable ?? candidates[0]).id,
    orientation,
  };
}
