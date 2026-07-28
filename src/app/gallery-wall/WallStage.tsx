"use client";

import { useRef, type PointerEvent as ReactPointerEvent, type KeyboardEvent } from "react";
import { clientDeltaToWall, type Placement } from "./_lib/arrange";
import type { FramedImage, Position, Wall } from "./_lib/state";

type WallStageProps = {
  wall: Wall;
  placements: readonly Placement[];
  images: readonly FramedImage[];
  /** Ids of frames to paint red (overlapping or off the wall). */
  invalidIds?: readonly string[];
  /**
   * Called with a frame's new top-left (in inches) as it is dragged or nudged.
   * When omitted the stage is a static, non-interactive preview.
   */
  onMove?: (id: string, position: Position) => void;
};

/** Frame border thickness, in wall inches, so it scales with the preview. */
const FRAME_BORDER = 0.5;
/** Mat inset as a fraction of the frame's shorter side. */
const MAT_RATIO = 0.07;
/** Keyboard nudge distance, in inches (larger with Shift). */
const NUDGE = 1;
const NUDGE_BIG = 5;

const ARROW_DELTAS: Record<string, Position> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

type DragSession = {
  id: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

/**
 * A to-scale preview of the gallery wall. The SVG viewBox is the wall's physical
 * size in inches, so a frame's inch dimensions map straight to viewBox units and
 * the whole thing scales to whatever width the container gives it without any
 * pixel math. Each frame is a white mat with a dark border and the photo cropped
 * to fill (object-fit: cover, via preserveAspectRatio slice).
 *
 * When {@link WallStageProps.onMove} is supplied the frames become movable: drag
 * with a pointer, or focus one and nudge it with the arrow keys (Shift for a
 * bigger step). Invalid frames are painted red. The static stage stays a single
 * labelled `img` region so a screen reader hears one summary; the interactive
 * stage turns each frame into a named button so keyboard users can move them.
 */
export default function WallStage({
  wall,
  placements,
  images,
  invalidIds = [],
  onMove,
}: WallStageProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<DragSession | null>(null);
  const srcById = new Map(images.map((image) => [image.id, image.src]));
  const labelById = new Map(images.map((image, i) => [image.id, `Frame ${i + 1}`]));
  const invalid = new Set(invalidIds);
  const interactive = Boolean(onMove);

  const label =
    placements.length === 0
      ? `Empty ${wall.width} by ${wall.height} inch wall`
      : `Gallery wall preview: ${placements.length} ${
          placements.length === 1 ? "frame" : "frames"
        } on a ${wall.width} by ${wall.height} inch wall`;

  const onPointerDown = (
    event: ReactPointerEvent<SVGGElement>,
    placement: Placement,
  ) => {
    if (!onMove) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id: placement.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: placement.x,
      originY: placement.y,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<SVGGElement>) => {
    const session = drag.current;
    if (!onMove || !session) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { dx, dy } = clientDeltaToWall(
      event.clientX - session.startX,
      event.clientY - session.startY,
      {
        pxWidth: rect.width,
        pxHeight: rect.height,
        wallWidth: wall.width,
        wallHeight: wall.height,
      },
    );
    onMove(session.id, { x: session.originX + dx, y: session.originY + dy });
  };

  const endDrag = (event: ReactPointerEvent<SVGGElement>) => {
    if (drag.current) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      drag.current = null;
    }
  };

  const onKeyDown = (
    event: KeyboardEvent<SVGGElement>,
    placement: Placement,
  ) => {
    if (!onMove) return;
    const delta = ARROW_DELTAS[event.key];
    if (!delta) return;
    event.preventDefault();
    const step = event.shiftKey ? NUDGE_BIG : NUDGE;
    onMove(placement.id, {
      x: placement.x + delta.x * step,
      y: placement.y + delta.y * step,
    });
  };

  return (
    <div className="h-full w-full overflow-hidden rounded-lg">
      <svg
        ref={svgRef}
        // A static preview is one image; an interactive one is a group of frame
        // buttons, so role="img" (with focusable children) would be nested-interactive.
        role={interactive ? "group" : "img"}
        aria-label={label}
        viewBox={`0 0 ${wall.width} ${wall.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full touch-none"
      >
        <rect
          x={0}
          y={0}
          width={wall.width}
          height={wall.height}
          className="fill-surface stroke-border"
          strokeWidth={0.25}
        />
        {placements.map((placement) => {
          const mat = Math.min(placement.width, placement.height) * MAT_RATIO;
          const innerX = placement.x + FRAME_BORDER + mat;
          const innerY = placement.y + FRAME_BORDER + mat;
          const innerW = placement.width - 2 * (FRAME_BORDER + mat);
          const innerH = placement.height - 2 * (FRAME_BORDER + mat);
          const clipId = `frame-clip-${placement.id}`;
          const src = srcById.get(placement.id);
          const isInvalid = invalid.has(placement.id);
          return (
            <g
              key={placement.id}
              data-frame-id={placement.id}
              data-invalid={isInvalid}
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={
                interactive
                  ? `${labelById.get(placement.id)}${
                      isInvalid ? " (overlapping)" : ""
                    }. Use arrow keys to move.`
                  : undefined
              }
              style={interactive ? { cursor: "move" } : undefined}
              onPointerDown={(e) => onPointerDown(e, placement)}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={(e) => onKeyDown(e, placement)}
            >
              <rect
                x={placement.x}
                y={placement.y}
                width={placement.width}
                height={placement.height}
                fill="#ffffff"
                stroke={isInvalid ? "#ef4444" : "#1f2937"}
                strokeWidth={isInvalid ? FRAME_BORDER * 1.6 : FRAME_BORDER}
              />
              <clipPath id={clipId}>
                <rect x={innerX} y={innerY} width={innerW} height={innerH} />
              </clipPath>
              {src ? (
                <image
                  href={src}
                  x={innerX}
                  y={innerY}
                  width={innerW}
                  height={innerH}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#${clipId})`}
                />
              ) : null}
              {isInvalid ? (
                <rect
                  x={placement.x}
                  y={placement.y}
                  width={placement.width}
                  height={placement.height}
                  fill="#ef4444"
                  fillOpacity={0.28}
                  pointerEvents="none"
                />
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
