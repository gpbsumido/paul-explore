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
  arrangeMasonry,
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

/** How unmoved frames auto-arrange: tidy rows, or staggered masonry columns. */
export type LayoutMode = "rows" | "masonry";

export type GalleryState = {
  images: FramedImage[];
  wall: Wall;
  /** Gap between frames on the wall, in inches. */
  gap: number;
  /** The auto layout used for frames that haven't been dragged. */
  layout: LayoutMode;
};

export type GalleryAction =
  | { type: "add-images"; images: UploadedImage[] }
  | { type: "remove-image"; id: string }
  | { type: "set-frame-size"; id: string; sizeId: string }
  | { type: "set-orientation"; id: string; orientation: Orientation }
  | { type: "move-image"; id: string; x: number; y: number }
  | { type: "auto-arrange"; layout?: LayoutMode }
  | { type: "set-layout"; layout: LayoutMode }
  | { type: "set-wall"; width: number; height: number }
  | { type: "set-gap"; gap: number };

/** A blank slate: no images, a typical 96 × 60 inch wall, a 3 inch gap. */
export const initialGalleryState: GalleryState = {
  images: [],
  wall: { width: 96, height: 60 },
  gap: 3,
  layout: "rows",
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

/** The auto placement of every image (per the layout mode), keyed by id. */
function autoPlacements(state: GalleryState): Map<string, Placement> {
  const input = {
    wallWidth: state.wall.width,
    wallHeight: state.wall.height,
    gap: state.gap,
    frames: state.images.map((image) => ({
      id: image.id,
      ...frameDimensions(image.frame),
    })),
  };
  const { placements } =
    state.layout === "masonry" ? arrangeMasonry(input) : arrangeWall(input);
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
        layout: action.layout ?? state.layout,
        images: state.images.map((image) => ({
          ...image,
          position: undefined,
        })),
      };
    case "set-layout":
      return {
        ...state,
        layout: action.layout,
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

/** One measured line of the printable hang sheet, all distances in inches. */
export type HangRow = {
  id: string;
  /** Matches the numbered photo in the sidebar, e.g. "Frame 1". */
  label: string;
  /** Oriented frame size, e.g. "8 × 10 in". */
  size: string;
  frameLeft: number;
  frameTop: number;
  width: number;
  height: number;
  /** How far below the frame's top the hook sits when the wire is taut. */
  hookDrop: number;
  /** Distance from the wall's left edge to the hook. */
  hookFromLeft: number;
  /** Distance from the wall's top edge to the hook. */
  hookFromTop: number;
};

/** A taut hanging wire pulls up to about a sixth of the frame, capped at 3in. */
const hookDropFor = (height: number): number => Math.min(height / 6, 3);

/**
 * The measurements needed to hang the wall: for each frame, where its hook goes,
 * measured from the wall's left and top edges. Kept in the photo-list order so a
 * printed sheet reads alongside the numbered photos.
 */
export function computeHangSheet(state: GalleryState): HangRow[] {
  const placementById = new Map(
    computePlacements(state).map((p) => [p.id, p]),
  );
  return state.images.map((image, index) => {
    const placed = placementById.get(image.id)!;
    const hookDrop = hookDropFor(placed.height);
    return {
      id: image.id,
      label: `Frame ${index + 1}`,
      size: `${placed.width} × ${placed.height} in`,
      frameLeft: placed.x,
      frameTop: placed.y,
      width: placed.width,
      height: placed.height,
      hookDrop,
      hookFromLeft: placed.x + placed.width / 2,
      hookFromTop: placed.y + hookDrop,
    };
  });
}

/** Serialise a gallery to a JSON string for saving. */
export function serializeGallery(state: GalleryState): string {
  return JSON.stringify(state);
}

function isWall(value: unknown): value is Wall {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Wall).width === "number" &&
    typeof (value as Wall).height === "number"
  );
}

/**
 * Parse a saved gallery back into state, or null if the string isn't a valid
 * saved gallery (bad JSON or the wrong shape).
 */
export function deserializeGallery(raw: string): GalleryState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const candidate = parsed as Partial<GalleryState>;
  if (
    !Array.isArray(candidate.images) ||
    !isWall(candidate.wall) ||
    typeof candidate.gap !== "number" ||
    (candidate.layout !== "rows" && candidate.layout !== "masonry")
  ) {
    return null;
  }
  return candidate as GalleryState;
}
