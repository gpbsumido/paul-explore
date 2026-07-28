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

/**
 * Arrange frames as a true staggered masonry: fixed-width columns, each new
 * frame dropped into the currently shortest column. Unlike the shelf layout the
 * columns rarely line up row-to-row, which reads as the classic gallery wall.
 * Column count comes from how many average-width frames fit across the wall.
 */
export function arrangeMasonry({
  wallWidth,
  wallHeight,
  gap,
  frames,
}: ArrangeInput): Arrangement {
  if (frames.length === 0) {
    return { placements: [], contentHeight: 0, overflows: false };
  }

  const avgWidth =
    frames.reduce((sum, f) => sum + f.width, 0) / frames.length;
  const columnCount = Math.max(
    1,
    Math.min(frames.length, Math.floor((wallWidth + gap) / (avgWidth + gap))),
  );
  const columnWidth = (wallWidth - gap * (columnCount - 1)) / columnCount;

  // Bottom (in wall units) currently reached by each column.
  const columnBottom = new Array<number>(columnCount).fill(0);
  const placements: Placement[] = [];

  for (const frame of frames) {
    let col = 0;
    for (let c = 1; c < columnCount; c++) {
      if (columnBottom[c] < columnBottom[col]) col = c;
    }
    const top = columnBottom[col] === 0 ? 0 : columnBottom[col] + gap;
    const colX = col * (columnWidth + gap);
    // Centre the frame within its column so mixed widths still line up tidily.
    placements.push({
      id: frame.id,
      x: colX + Math.max(0, (columnWidth - frame.width) / 2),
      y: top,
      width: frame.width,
      height: frame.height,
    });
    columnBottom[col] = top + frame.height;
  }

  const contentHeight = Math.max(...columnBottom);
  const overflows =
    contentHeight > wallHeight || frames.some((f) => f.width > wallWidth);

  return { placements, contentHeight, overflows };
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
 * how large the wall is currently rendered. The wall is drawn with
 * `preserveAspectRatio` inside a fixed-size window, so it's scaled uniformly by
 * the tighter of the two dimensions (letterboxed on the other); dividing the
 * pixel delta by that single scale keeps a dragged frame under the cursor at any
 * zoom and any window shape. Returns a zero delta before the wall is laid out.
 */
export function clientDeltaToWall(
  dxPx: number,
  dyPx: number,
  { pxWidth, pxHeight, wallWidth, wallHeight }: WallPixels,
): { dx: number; dy: number } {
  if (pxWidth <= 0 || pxHeight <= 0) return { dx: 0, dy: 0 };
  const scale = Math.min(pxWidth / wallWidth, pxHeight / wallHeight);
  return { dx: dxPx / scale, dy: dyPx / scale };
}

/** Scroll geometry of the zoomed preview window. */
export type ViewportMetrics = {
  scrollLeft: number;
  scrollTop: number;
  scrollWidth: number;
  scrollHeight: number;
  clientWidth: number;
  clientHeight: number;
};

/**
 * The portion of the wall currently visible in the zoomed window, in wall units,
 * for drawing the minimap indicator. When nothing is scrollable (zoomed out to
 * fit) it covers the whole wall.
 */
export function viewportRect(
  m: ViewportMetrics,
  wall: { width: number; height: number },
): Placement {
  if (m.scrollWidth <= 0 || m.scrollHeight <= 0) {
    return { id: "viewport", x: 0, y: 0, width: wall.width, height: wall.height };
  }
  const fw = Math.min(1, m.clientWidth / m.scrollWidth);
  const fh = Math.min(1, m.clientHeight / m.scrollHeight);
  return {
    id: "viewport",
    x: (m.scrollLeft / m.scrollWidth) * wall.width,
    y: (m.scrollTop / m.scrollHeight) * wall.height,
    width: fw * wall.width,
    height: fh * wall.height,
  };
}
