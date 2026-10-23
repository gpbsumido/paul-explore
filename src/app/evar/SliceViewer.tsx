"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { toGray, type CtWindow, type Point } from "@/lib/evar/measure";
import { MAX_SCALE, MIN_SCALE, follow, fullView, panBy, toImage, toViewport, zoomAt, type View } from "@/lib/evar/zoom";
import { ACCENT_BAND } from "@/lib/accentBand";
import Disclosure from "./Disclosure";

type Props = {
  /** Pixels across a slice, which is square. */
  size: number;
  /** One axial slice in HU, or null while a scan is still loading. */
  sliceAt: (z: number) => Int16Array | null;
  /** Set when a scan failed to load, so the viewer can say so instead of loading forever. */
  loadError?: { onRetry: () => void } | null;
  slice: number;
  window: CtWindow;
  points: readonly Point[];
  onPlace: (point: Point) => void;
  onClear: () => void;
  onSliceStep: (delta: number) => void;
  /** Sizes the viewer; defaults to its natural 576px cap. */
  className?: string;
};

const ARROWS: Record<string, Point> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

/** The canvas is drawn at twice the slice's size, so calipers stay crisp when zoomed. */
const BACKING = 2;
/** How far a press can wander, in screen pixels, and still count as a click rather than a drag. */
const DRAG_PX = 4;
/** Each button press or key doubles or halves the zoom. */
const STEP = 2;

/** Windowed greyscale RGBA for one slice, ready for putImageData. */
function sliceRgba(hu: Int16Array, window: CtWindow): Uint8ClampedArray<ArrayBuffer> {
  const rgba = new Uint8ClampedArray(hu.length * 4);
  hu.forEach((value, i) => {
    const grey = toGray(value, window);
    rgba[i * 4] = grey;
    rgba[i * 4 + 1] = grey;
    rgba[i * 4 + 2] = grey;
    rgba[i * 4 + 3] = 255;
  });
  return rgba;
}

/** Small plus sign at a canvas point. */
function cross(ctx: CanvasRenderingContext2D, p: Point, arm: number) {
  ctx.beginPath();
  ctx.moveTo(p.x - arm, p.y);
  ctx.lineTo(p.x + arm, p.y);
  ctx.moveTo(p.x, p.y - arm);
  ctx.lineTo(p.x, p.y + arm);
  ctx.stroke();
}

/** "2×", or "2.5×" part way through a wheel zoom. */
const zoomLabel = (scale: number) => `${Math.round(scale * 10) / 10}×`;

type Gesture = {
  start: Point;
  startView: View;
  moved: boolean;
  /** Distance and midpoint of the last two-finger frame, for pinching. */
  pinch: { distance: number; mid: Point } | null;
};

/**
 * One axial slice on a canvas, with a two-point caliper, zoom and pan.
 *
 * Mouse users click the two ends, drag to pan and scroll to zoom. Touch users
 * tap, drag and pinch. Keyboard users focus the image, steer a crosshair with
 * the arrows (Shift moves five pixels), press Enter at each end, and zoom with
 * + and -, so the whole exercise works without a pointer. Points are always in
 * image pixels, so a caliper reads the same at any zoom.
 */
export default function SliceViewer({
  size,
  sliceAt,
  loadError = null,
  slice,
  window,
  points,
  onPlace,
  onClear,
  onSliceStep,
  className = "max-w-[576px]",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<Point>({ x: size / 2, y: size / 2 });
  const [focused, setFocused] = useState(false);
  const [view, setView] = useState<View>(() => fullView(size));
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);

  // Slices are cached where they're made, so this hands back the same array
  // for the same slice and the greyscale below only reruns when it changes.
  const hu = useMemo(() => sliceAt(slice), [sliceAt, slice]);
  const rgba = useMemo(() => (hu === null ? null : sliceRgba(hu, window)), [hu, window]);

  // The slice is painted once per slice or window onto its own canvas, then
  // scaled through the view on every redraw.
  const slab = useMemo(() => {
    if (typeof document === "undefined" || rgba === null) return null;
    const off = document.createElement("canvas");
    off.width = size;
    off.height = size;
    const ctx = off.getContext("2d");
    if (!ctx) return null;
    ctx.putImageData(new ImageData(rgba, size, size), 0, 0);
    return off;
  }, [rgba, size]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !slab) return;
    const out = size * BACKING;
    const span = size / view.scale;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(slab, view.x - span / 2, view.y - span / 2, span, span, 0, 0, out, out);
    const onCanvas = (p: Point) => {
      const at = toViewport(view, p, size);
      return { x: at.x * out, y: at.y * out };
    };
    ctx.strokeStyle = ACCENT_BAND.gold;
    ctx.lineWidth = 1.5 * BACKING;
    const placed = points.map(onCanvas);
    placed.forEach((p) => cross(ctx, p, 4 * BACKING));
    if (placed.length === 2) {
      ctx.beginPath();
      ctx.moveTo(placed[0].x, placed[0].y);
      ctx.lineTo(placed[1].x, placed[1].y);
      ctx.stroke();
    }
    if (focused) {
      ctx.strokeStyle = ACCENT_BAND.azure;
      cross(ctx, onCanvas(cursor), 8 * BACKING);
    }
  }, [slab, view, points, cursor, focused, size]);

  /** Viewport fraction under a pointer, or null when the surface hasn't been laid out. */
  const fractionAt = (clientX: number, clientY: number): Point | null => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
  };

  // React attaches wheel listeners as passive, which can't stop the page
  // scrolling under the image, so this one is attached by hand.
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const onWheel = (event: WheelEvent) => {
      const rect = surface.getBoundingClientRect();
      if (rect.width === 0) return;
      event.preventDefault();
      const at = { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
      const factor = Math.exp(-event.deltaY * 0.002);
      setView((v) => zoomAt(v, factor, toImage(v, at, size), size));
    };
    surface.addEventListener("wheel", onWheel, { passive: false });
    return () => surface.removeEventListener("wheel", onWheel);
  }, [size]);

  const clamp = (v: number) => Math.min(size - 1, Math.max(0, v));

  const zoomAround = (factor: number, anchor: Point) => setView((v) => zoomAt(v, factor, anchor, size));
  const zoomCentre = (factor: number) => setView((v) => zoomAt(v, factor, { x: v.x, y: v.y }, size));

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const arrow = ARROWS[event.key];
    if (arrow) {
      event.preventDefault();
      const step = event.shiftKey ? 5 : 1;
      const next = { x: clamp(cursor.x + arrow.x * step), y: clamp(cursor.y + arrow.y * step) };
      setCursor(next);
      setView((v) => follow(v, next, size));
      return;
    }
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomAround(STEP, cursor);
      return;
    }
    if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      zoomAround(1 / STEP, cursor);
      return;
    }
    if (event.key === "0") {
      event.preventDefault();
      setView(fullView(size));
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onPlace(cursor);
      return;
    }
    if (event.key === "Escape") {
      onClear();
      return;
    }
    if (event.key === "PageDown" || event.key === "PageUp") {
      event.preventDefault();
      onSliceStep(event.key === "PageDown" ? 1 : -1);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const here = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, here);
    if (pointers.current.size === 1) {
      gesture.current = { start: here, startView: view, moved: false, pinch: null };
      return;
    }
    // A second finger turns the press into a pinch, which never places a point.
    if (gesture.current) gesture.current = { ...gesture.current, moved: true, pinch: null };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || !pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;

    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const last = g.pinch;
      gesture.current = { ...g, pinch: { distance, mid } };
      if (!last || last.distance === 0) return;
      const at = { x: (mid.x - rect.left) / rect.width, y: (mid.y - rect.top) / rect.height };
      setView((v) => {
        const zoomed = zoomAt(v, distance / last.distance, toImage(v, at, size), size);
        return panBy(zoomed, { x: (mid.x - last.mid.x) / rect.width, y: (mid.y - last.mid.y) / rect.height }, size);
      });
      return;
    }

    const dx = event.clientX - g.start.x;
    const dy = event.clientY - g.start.y;
    if (!g.moved && Math.hypot(dx, dy) < DRAG_PX) return;
    gesture.current = { ...g, moved: true };
    setView(panBy(g.startView, { x: dx / rect.width, y: dy / rect.height }, size));
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    const wasOnly = pointers.current.size === 1;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size > 0) {
      // One finger of a pinch lifted: carry on as a drag from where the other one is.
      const [rest] = [...pointers.current.values()];
      if (g) gesture.current = { start: rest, startView: view, moved: true, pinch: null };
      return;
    }
    gesture.current = null;
    if (!g || g.moved || !wasOnly) return;
    const at = fractionAt(event.clientX, event.clientY);
    if (!at) return;
    const image = toImage(view, at, size);
    const point = { x: clamp(image.x), y: clamp(image.y) };
    setCursor(point);
    onPlace(point);
  };

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 0) gesture.current = null;
  };

  const zoomButton =
    "grid h-8 min-w-8 place-items-center rounded-md border border-white/30 bg-black/60 px-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:opacity-40 disabled:hover:bg-black/60";

  return (
    <div className={`relative mx-auto w-full ${className}`}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the image is a caliper surface: arrows steer, Enter places a point, so it needs focus and its own keys, which is what role="application" announces */}
      <div
        ref={surfaceRef}
        role="application"
        aria-label="Axial CT slice"
        aria-describedby="evar-viewer-help"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- keyboard calipers need the image focusable
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="cursor-crosshair touch-none rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <canvas
          ref={canvasRef}
          width={size * BACKING}
          height={size * BACKING}
          aria-hidden
          className="block aspect-square w-full rounded-xl bg-black"
        />
      </div>
      {hu !== null ? null : loadError ? (
        <div role="alert" className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 text-center text-[14px] font-semibold text-white">
          <p>Couldn&apos;t load this scan. Check your connection and try again.</p>
          <button
            type="button"
            onClick={loadError.onRetry}
            className="rounded-md border border-white/40 bg-black/60 px-3 py-1.5 text-[13px] hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            Try again
          </button>
        </div>
      ) : (
        <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[14px] font-semibold text-white">
          Loading the scan…
        </p>
      )}
      <span aria-hidden className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-white">
        R
      </span>
      <span aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-white">
        L
      </span>
      <div role="group" aria-label="Zoom" className="absolute right-2 top-2 flex items-center gap-1">
        <button type="button" aria-label="Zoom out" className={zoomButton} disabled={view.scale <= MIN_SCALE} onClick={() => zoomCentre(1 / STEP)}>
          −
        </button>
        <span aria-live="polite" className="min-w-10 rounded-md bg-black/60 px-1.5 py-1 text-center font-mono text-xs font-semibold text-white">
          {zoomLabel(view.scale)}
        </span>
        <button type="button" aria-label="Zoom in" className={zoomButton} disabled={view.scale >= MAX_SCALE} onClick={() => zoomCentre(STEP)}>
          +
        </button>
        <button type="button" aria-label="Reset zoom" className={zoomButton} disabled={view.scale <= MIN_SCALE} onClick={() => setView(fullView(size))}>
          1:1
        </button>
      </div>
      <Disclosure label="Viewer controls" className="mt-2">
        <p id="evar-viewer-help" className="text-[13px] text-muted">
          The patient&apos;s right is on the left of the image. Click two points to measure, drag to
          pan, and scroll or pinch to zoom. From the keyboard, focus the image, move with the arrow
          keys (Shift for bigger steps) and press Enter at each end; + and − zoom and 0 resets.
          Escape clears; Page Up and Page Down change slice.
        </p>
      </Disclosure>
    </div>
  );
}
