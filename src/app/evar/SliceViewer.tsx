"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { sliceHU, type EvarCase } from "@/lib/evar/phantom";
import { toGray, type CtWindow, type Point } from "@/lib/evar/measure";
import { ACCENT_BAND } from "@/lib/accentBand";

type Props = {
  evarCase: EvarCase;
  slice: number;
  window: CtWindow;
  points: readonly Point[];
  onPlace: (point: Point) => void;
  onClear: () => void;
  onSliceStep: (delta: number) => void;
};

const ARROWS: Record<string, Point> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

/** Windowed greyscale RGBA for one slice, ready for putImageData. */
function sliceRgba(evarCase: EvarCase, slice: number, window: CtWindow): Uint8ClampedArray<ArrayBuffer> {
  const hu = sliceHU(evarCase, slice);
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

/** Small plus sign at an image point. */
function cross(ctx: CanvasRenderingContext2D, p: Point, arm: number) {
  ctx.beginPath();
  ctx.moveTo(p.x - arm, p.y);
  ctx.lineTo(p.x + arm, p.y);
  ctx.moveTo(p.x, p.y - arm);
  ctx.lineTo(p.x, p.y + arm);
  ctx.stroke();
}

/**
 * One axial slice on a canvas, with a two-point caliper.
 *
 * Mouse users click the two ends. Keyboard users focus the image, steer a
 * crosshair with the arrows (Shift moves five pixels) and press Enter at each
 * end, so the whole exercise works without a pointer.
 */
export default function SliceViewer({ evarCase, slice, window, points, onPlace, onClear, onSliceStep }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const centre = evarCase.size / 2;
  const [cursor, setCursor] = useState<Point>({ x: centre, y: centre });
  const [focused, setFocused] = useState(false);

  const rgba = useMemo(() => sliceRgba(evarCase, slice, window), [evarCase, slice, window]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(new ImageData(rgba, evarCase.size, evarCase.size), 0, 0);
    ctx.strokeStyle = ACCENT_BAND.gold;
    ctx.fillStyle = ACCENT_BAND.gold;
    ctx.lineWidth = 1.5;
    points.forEach((p) => cross(ctx, p, 4));
    if (points.length === 2) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.stroke();
    }
    if (focused) {
      ctx.strokeStyle = ACCENT_BAND.azure;
      cross(ctx, cursor, 8);
    }
  }, [rgba, points, cursor, focused, evarCase.size]);

  const clamp = (v: number) => Math.min(evarCase.size - 1, Math.max(0, v));

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const arrow = ARROWS[event.key];
    if (arrow) {
      event.preventDefault();
      const step = event.shiftKey ? 5 : 1;
      setCursor((c) => ({ x: clamp(c.x + arrow.x * step), y: clamp(c.y + arrow.y * step) }));
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
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const point = {
      x: clamp(((event.clientX - rect.left) / rect.width) * evarCase.size),
      y: clamp(((event.clientY - rect.top) / rect.height) * evarCase.size),
    };
    setCursor(point);
    onPlace(point);
  };

  return (
    <div className="relative mx-auto w-full max-w-[576px]">
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the image is a caliper surface: arrows steer, Enter places a point, so it needs focus and its own keys, which is what role="application" announces */}
      <div
        role="application"
        aria-label="Axial CT slice"
        aria-describedby="evar-viewer-help"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- keyboard calipers need the image focusable
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="cursor-crosshair rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <canvas
          ref={canvasRef}
          width={evarCase.size}
          height={evarCase.size}
          aria-hidden
          className="block aspect-square w-full rounded-xl bg-black"
        />
      </div>
      <span aria-hidden className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-white">
        R
      </span>
      <span aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-white">
        L
      </span>
      <p id="evar-viewer-help" className="mt-2 text-[13px] text-muted">
        The patient&apos;s right is on the left of the image. Click two points to measure, or focus
        the image, move with the arrow keys (Shift for bigger steps) and press Enter at each end.
        Escape clears; Page Up and Page Down change slice.
      </p>
    </div>
  );
}
