/**
 * Zoom and pan for the slice viewer, as plain maths on a view rectangle.
 *
 * A view is a scale and the image point sitting at the middle of the
 * viewport. Calipers never see any of this: they stay in image pixels, so a
 * measurement reads the same at any zoom. Viewport positions are fractions,
 * 0 at the left or top edge and 1 at the right or bottom, so nothing here
 * needs to know how big the canvas is on screen.
 */

import type { Point } from "./measure";

export type View = { scale: number; x: number; y: number };

export const MIN_SCALE = 1;
export const MAX_SCALE = 8;

/** The whole image, centred. */
export const fullView = (size: number): View => ({ scale: 1, x: size / 2, y: size / 2 });

/** Keeps the visible window inside the image, so it can't be panned off into nothing. */
function clamp(view: View, size: number): View {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale));
  const half = size / (2 * scale);
  const within = (v: number) => Math.min(size - half, Math.max(half, v));
  return { scale, x: within(view.x), y: within(view.y) };
}

/** Image point under a viewport fraction. */
export function toImage(view: View, at: Point, size: number): Point {
  const span = size / view.scale;
  return { x: view.x + (at.x - 0.5) * span, y: view.y + (at.y - 0.5) * span };
}

/** Viewport fraction an image point sits at. Off-screen points come back outside 0 to 1. */
export function toViewport(view: View, point: Point, size: number): Point {
  const span = size / view.scale;
  return { x: (point.x - view.x) / span + 0.5, y: (point.y - view.y) / span + 0.5 };
}

/** Zooms by a factor while keeping `anchor`, an image point, where it is on screen. */
export function zoomAt(view: View, factor: number, anchor: Point, size: number): View {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale * factor));
  const ratio = view.scale / scale;
  return clamp(
    { scale, x: anchor.x - (anchor.x - view.x) * ratio, y: anchor.y - (anchor.y - view.y) * ratio },
    size,
  );
}

/** Moves the image along with a drag of `by`, measured in viewport fractions. */
export function panBy(view: View, by: Point, size: number): View {
  const span = size / view.scale;
  return clamp({ ...view, x: view.x - by.x * span, y: view.y - by.y * span }, size);
}

/** Pans just far enough that `point` is on screen again, for the keyboard crosshair. */
export function follow(view: View, point: Point, size: number): View {
  const at = toViewport(view, point, size);
  const span = size / view.scale;
  const shift = (v: number) => (v < 0 ? v : v > 1 ? v - 1 : 0) * span;
  return clamp({ ...view, x: view.x + shift(at.x), y: view.y + shift(at.y) }, size);
}
