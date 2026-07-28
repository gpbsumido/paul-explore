/**
 * The gallery's state model: a pure reducer over the uploaded images and the
 * wall, plus selectors that turn that state into a wall arrangement and validate
 * it. Keeping all of it here (and free of React) means the interesting behaviour
 * is unit tested directly, and the component is just wiring.
 *
 * Frames live in one of two modes. Fresh uploads have no `position` and fall
 * into the tidy auto layout ({@link arrangeWall}). The moment you drag a frame,
 * every frame is frozen at its current spot and gains an explicit `position`, so
 * dragging one never shuffles the others. "Auto-arrange" drops back to mode one
 * by clearing positions.
 */

import {
  chooseBestFrame,
  frameDimensions,
  type Frame,
  type Orientation,
} from "./frames";
import {
  arrangeWall,
  findOutOfBounds,
  findOverlaps,
  type Arrangement,
  type Placement,
} from "./arrange";

/** An uploaded image before it is framed. */
export type UploadedImage = {
  id: string;
  /** Object URL or data URL for rendering the image. */
  src: string;
  /** Natural width / height of the image. */
  aspect: number;
};

/** A point on the wall, in inches, measured from the top-left corner. */
export type Position = { x: number; y: number };

/**
 * An uploaded image together with the frame chosen for it. `position` is the
 * frame's manual top-left; when absent the frame is auto-arranged.
 */
export type FramedImage = UploadedImage & { frame: Frame; position?: Position };

/** Wall size in inches. */
export type Wall = { width: number; height: number };

export type GalleryState = {
  images: FramedImage[];
  wall: Wall;
  /** Gap between frames on the wall, in inches. */
  gap: number;
};

export type GalleryAction =
  | { type: "add-images"; images: UploadedImage[] }
  | { type: "remove-image"; id: string }
  | { type: "set-frame-size"; id: string; sizeId: string }
  | { type: "set-orientation"; id: string; orientation: Orientation }
  | { type: "move-image"; id: string; x: number; y: number }
  | { type: "auto-arrange" }
  | { type: "set-wall"; width: number; height: number }
  | { type: "set-gap"; gap: number };

/** A blank slate: no images, a typical 96 × 60 inch wall, a 3 inch gap. */
export const initialGalleryState: GalleryState = {
  images: [],
  wall: { width: 96, height: 60 },
  gap: 3,
};

const MIN_WALL = 1;
const MIN_GAP = 0;

function frameFor(image: UploadedImage): FramedImage {
  return { ...image, frame: chooseBestFrame(image.aspect) };
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), Math.max(min, max));

/** Keep a frame of the given size fully on the wall. */
function clampToWall(position: Position, frame: Frame, wall: Wall): Position {
  const dims = frameDimensions(frame);
  return {
    x: clamp(position.x, 0, wall.width - dims.width),
    y: clamp(position.y, 0, wall.height - dims.height),
  };
}

/** The auto (shelf-packed) placement of every image, keyed by id. */
function autoPlacements(state: GalleryState): Map<string, Placement> {
  const { placements } = arrangeWall({
    wallWidth: state.wall.width,
    wallHeight: state.wall.height,
    gap: state.gap,
    frames: state.images.map((image) => ({
      id: image.id,
      ...frameDimensions(image.frame),
    })),
  });
  return new Map(placements.map((p) => [p.id, p]));
}

/** Give every image an explicit position, freezing the current layout. */
function freezePositions(state: GalleryState): FramedImage[] {
  const auto = autoPlacements(state);
  return state.images.map((image) => {
    if (image.position) return image;
    const placed = auto.get(image.id);
    return {
      ...image,
      position: placed ? { x: placed.x, y: placed.y } : { x: 0, y: 0 },
    };
  });
}

function updateFrame(
  images: FramedImage[],
  id: string,
  wall: Wall,
  next: (frame: Frame) => Frame,
): FramedImage[] {
  return images.map((image) => {
    if (image.id !== id) return image;
    const frame = next(image.frame);
    return {
      ...image,
      frame,
      position: image.position
        ? clampToWall(image.position, frame, wall)
        : undefined,
    };
  });
}

export function galleryReducer(
  state: GalleryState,
  action: GalleryAction,
): GalleryState {
  switch (action.type) {
    case "add-images":
      return {
        ...state,
        images: [...state.images, ...action.images.map(frameFor)],
      };
    case "remove-image":
      return {
        ...state,
        images: state.images.filter((image) => image.id !== action.id),
      };
    case "set-frame-size":
      return {
        ...state,
        images: updateFrame(state.images, action.id, state.wall, (frame) => ({
          ...frame,
          sizeId: action.sizeId,
        })),
      };
    case "set-orientation":
      return {
        ...state,
        images: updateFrame(state.images, action.id, state.wall, (frame) => ({
          ...frame,
          orientation: action.orientation,
        })),
      };
    case "move-image": {
      const frozen = freezePositions(state);
      return {
        ...state,
        images: frozen.map((image) =>
          image.id === action.id
            ? {
                ...image,
                position: clampToWall(
                  { x: action.x, y: action.y },
                  image.frame,
                  state.wall,
                ),
              }
            : image,
        ),
      };
    }
    case "auto-arrange":
      return {
        ...state,
        images: state.images.map((image) => ({
          ...image,
          position: undefined,
        })),
      };
    case "set-wall":
      return {
        ...state,
        wall: {
          width: Math.max(MIN_WALL, action.width),
          height: Math.max(MIN_WALL, action.height),
        },
      };
    case "set-gap":
      return { ...state, gap: Math.max(MIN_GAP, action.gap) };
  }
}

/**
 * Where every frame sits on the wall: a manual position if the frame has been
 * dragged, otherwise its slot in the tidy auto layout.
 */
export function computePlacements(state: GalleryState): Placement[] {
  const auto = autoPlacements(state);
  return state.images.map((image) => {
    const dims = frameDimensions(image.frame);
    const fallback = auto.get(image.id);
    const pos = image.position ?? { x: fallback?.x ?? 0, y: fallback?.y ?? 0 };
    return { id: image.id, x: pos.x, y: pos.y, ...dims };
  });
}

/** The result of checking an arrangement before it can be saved. */
export type Validation = {
  placements: Placement[];
  /** Ids of frames that overlap at least one other frame. */
  overlaps: string[];
  /** Ids of frames that hang off an edge of the wall. */
  outOfBounds: string[];
  /** Every id that fails a check, deduped -- what the preview paints red. */
  invalidIds: string[];
  /** True when there's at least one frame and nothing is wrong. */
  canSave: boolean;
};

/** Validate the current arrangement: overlaps, out-of-bounds, and can-save. */
export function computeValidation(state: GalleryState): Validation {
  const placements = computePlacements(state);
  const overlaps = findOverlaps(placements);
  const outOfBounds = findOutOfBounds(placements, state.wall);
  const invalidIds = [...new Set([...overlaps, ...outOfBounds])];
  return {
    placements,
    overlaps,
    outOfBounds,
    invalidIds,
    canSave: placements.length > 0 && invalidIds.length === 0,
  };
}

/**
 * Resolve the current state to a wall arrangement of placed frames. Retained for
 * the preview's sizing needs; `overflows` folds in both a too-tall stack and any
 * frame dragged or grown off the wall.
 */
export function computeArrangement(state: GalleryState): Arrangement {
  const placements = computePlacements(state);
  const contentHeight = placements.reduce(
    (max, p) => Math.max(max, p.y + p.height),
    0,
  );
  const overflows = findOutOfBounds(placements, state.wall).length > 0;
  return { placements, contentHeight, overflows };
}
