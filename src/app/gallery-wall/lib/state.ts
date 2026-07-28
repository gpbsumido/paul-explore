/**
 * The gallery's state model: a pure reducer over the uploaded images and the
 * wall, plus a selector that turns that state into a wall arrangement. Keeping
 * all of it here (and free of React) means the interesting behaviour is unit
 * tested directly, and the component is just wiring.
 */

import {
  chooseBestFrame,
  frameDimensions,
  type Frame,
  type Orientation,
} from "./frames";
import { arrangeWall, type Arrangement } from "./layout";

/** An uploaded image before it is framed. */
export type UploadedImage = {
  id: string;
  /** Object URL or data URL for rendering the image. */
  src: string;
  /** Natural width / height of the image. */
  aspect: number;
};

/** An uploaded image together with the frame chosen for it. */
export type FramedImage = UploadedImage & { frame: Frame };

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

function updateFrame(
  images: FramedImage[],
  id: string,
  next: (frame: Frame) => Frame,
): FramedImage[] {
  return images.map((image) =>
    image.id === id ? { ...image, frame: next(image.frame) } : image,
  );
}

export function galleryReducer(
  state: GalleryState,
  action: GalleryAction,
): GalleryState {
  switch (action.type) {
    case "add-images":
      return { ...state, images: [...state.images, ...action.images.map(frameFor)] };
    case "remove-image":
      return {
        ...state,
        images: state.images.filter((image) => image.id !== action.id),
      };
    case "set-frame-size":
      return {
        ...state,
        images: updateFrame(state.images, action.id, (frame) => ({
          ...frame,
          sizeId: action.sizeId,
        })),
      };
    case "set-orientation":
      return {
        ...state,
        images: updateFrame(state.images, action.id, (frame) => ({
          ...frame,
          orientation: action.orientation,
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

/** Resolve the current state to a wall arrangement of placed frames. */
export function computeArrangement(state: GalleryState): Arrangement {
  return arrangeWall({
    wallWidth: state.wall.width,
    wallHeight: state.wall.height,
    gap: state.gap,
    frames: state.images.map((image) => ({
      id: image.id,
      ...frameDimensions(image.frame),
    })),
  });
}
