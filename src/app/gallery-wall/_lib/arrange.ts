/**
 * The wall arrangement engine. Given a wall size and a list of framed images
 * with physical dimensions, it packs them into centered rows (a "shelf" layout,
 * the way most gallery walls actually read) and reports whether the result
 * spills past the wall. Pure and unit-agnostic: pass everything in the same unit
 * and you get placements back in that unit.
 */

/** A framed image to place, sized in the wall's unit. */
export type LayoutFrame = { id: string; width: number; height: number };

/** Where a frame ends up on the wall. Origin is the top-left of the wall. */
export type Placement = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ArrangeInput = {
  wallWidth: number;
  wallHeight: number;
  /** Spacing between neighbouring frames, in the wall's unit. */
  gap: number;
  frames: readonly LayoutFrame[];
};

export type Arrangement = {
  placements: Placement[];
  /** Total height the rows occupy, including the gaps between them. */
  contentHeight: number;
  /** True when the frames don't fit the wall's width or height. */
  overflows: boolean;
};

type Row = { frames: LayoutFrame[]; width: number; height: number };

/** Greedily group frames into rows that each fit within the wall width. */
function packRows(
  frames: readonly LayoutFrame[],
  wallWidth: number,
  gap: number,
): Row[] {
  const rows: Row[] = [];
  let current: Row | null = null;

  for (const frame of frames) {
    if (current === null) {
      current = { frames: [frame], width: frame.width, height: frame.height };
      rows.push(current);
      continue;
    }
    const nextWidth = current.width + gap + frame.width;
    if (nextWidth > wallWidth) {
      current = { frames: [frame], width: frame.width, height: frame.height };
      rows.push(current);
      continue;
    }
    current.frames.push(frame);
    current.width = nextWidth;
    current.height = Math.max(current.height, frame.height);
  }

  return rows;
}

/**
 * Arrange frames into centered rows on the wall. Rows stack from the top with
 * the gap between them; each frame is centered vertically inside its row so a
 * short frame sits level with a tall neighbour.
 */
export function arrangeWall({
  wallWidth,
  wallHeight,
  gap,
  frames,
}: ArrangeInput): Arrangement {
  const rows = packRows(frames, wallWidth, gap);
  const placements: Placement[] = [];
  let rowTop = 0;

  rows.forEach((row, index) => {
    if (index > 0) rowTop += gap;
    let x = (wallWidth - row.width) / 2;
    for (const frame of row.frames) {
      placements.push({
        id: frame.id,
        x,
        y: rowTop + (row.height - frame.height) / 2,
        width: frame.width,
        height: frame.height,
      });
      x += frame.width + gap;
    }
    rowTop += row.height;
  });

  const contentHeight = rowTop;
  const tooTall = contentHeight > wallHeight;
  const tooWide = rows.some((row) => row.width > wallWidth);

  return { placements, contentHeight, overflows: tooTall || tooWide };
}

// A hair of slack so floating-point drift doesn't report a flush frame as
// overlapping or a perfectly-fitted frame as off the wall.
const EPS = 1e-6;

/**
 * Whether two placed frames intersect. Frames that only touch edges (one starts
 * exactly where the other ends) count as apart, so a tidy flush layout is valid.
 */
export function rectsOverlap(a: Placement, b: Placement): boolean {
  return (
    a.x + EPS < b.x + b.width &&
    b.x + EPS < a.x + a.width &&
    a.y + EPS < b.y + b.height &&
    b.y + EPS < a.y + a.height
  );
}

/** The ids of every frame that overlaps at least one other frame. */
export function findOverlaps(placements: readonly Placement[]): string[] {
  const hit = new Set<string>();
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      if (rectsOverlap(placements[i], placements[j])) {
        hit.add(placements[i].id);
        hit.add(placements[j].id);
      }
    }
  }
  return [...hit];
}

/** The ids of every frame that pokes past an edge of the wall. */
export function findOutOfBounds(
  placements: readonly Placement[],
  wall: { width: number; height: number },
): string[] {
  return placements
    .filter(
      (p) =>
        p.x < -EPS ||
        p.y < -EPS ||
        p.x + p.width > wall.width + EPS ||
        p.y + p.height > wall.height + EPS,
    )
    .map((p) => p.id);
}

export type WallPixels = {
  /** Rendered width of the wall in CSS pixels. */
  pxWidth: number;
  /** Rendered height of the wall in CSS pixels. */
  pxHeight: number;
  wallWidth: number;
  wallHeight: number;
};

/**
 * Convert a pointer movement measured in screen pixels into wall units, given
 * how large the wall is currently rendered. Used by the drag handler so a
 * dragged frame tracks the cursor at any zoom level. Returns a zero delta when
 * the wall hasn't been laid out yet (rendered size of zero).
 */
export function clientDeltaToWall(
  dxPx: number,
  dyPx: number,
  { pxWidth, pxHeight, wallWidth, wallHeight }: WallPixels,
): { dx: number; dy: number } {
  if (pxWidth <= 0 || pxHeight <= 0) return { dx: 0, dy: 0 };
  return {
    dx: (dxPx * wallWidth) / pxWidth,
    dy: (dyPx * wallHeight) / pxHeight,
  };
}
