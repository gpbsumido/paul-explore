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

const area = (frame: LayoutFrame): number => frame.width * frame.height;

/**
 * A stable 0..1 value for a string. Used to stagger frames deterministically:
 * the same wall always arranges the same way, but nothing lines up on a grid.
 */
function hash01(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1024) / 1024;
}

/** A run of the packed cluster's top edge: everything left of `y` is filled. */
type Skyline = { x: number; width: number; y: number };

/** The highest point of the skyline across a span, or null if it runs off. */
function spanTop(skyline: Skyline[], x: number, width: number): number | null {
  let top = 0;
  let covered = 0;
  for (const run of skyline) {
    if (run.x + run.width <= x) continue;
    if (run.x >= x + width) break;
    top = Math.max(top, run.y);
    covered = Math.min(x + width, run.x + run.width) - x;
  }
  return covered >= width - 1e-9 ? top : null;
}

/** Lay a frame across the skyline, raising every run it covers. */
function raise(
  skyline: Skyline[],
  x: number,
  width: number,
  top: number,
): Skyline[] {
  const next: Skyline[] = [];
  for (const run of skyline) {
    const overlaps = run.x < x + width && run.x + run.width > x;
    if (!overlaps) {
      next.push(run);
      continue;
    }
    if (run.x < x) next.push({ x: run.x, width: x - run.x, y: run.y });
    const rightEdge = run.x + run.width;
    if (rightEdge > x + width) {
      next.push({ x: x + width, width: rightEdge - (x + width), y: run.y });
    }
  }
  next.push({ x, width, y: top });
  next.sort((a, b) => a.x - b.x);

  // Fold neighbouring runs that ended up at the same height.
  return next.reduce<Skyline[]>((merged, run) => {
    const last = merged[merged.length - 1];
    if (
      last &&
      Math.abs(last.y - run.y) < 1e-9 &&
      Math.abs(last.x + last.width - run.x) < 1e-9
    ) {
      last.width += run.width;
      return merged;
    }
    merged.push({ ...run });
    return merged;
  }, []);
}

/**
 * Arrange frames the way a salon wall actually reads: one tightly interlocked
 * cluster, centred on the wall, with frames of different sizes tessellated
 * together rather than lined up on a shelf.
 *
 * It is a bottom-left skyline pack. Each frame is dropped into the position
 * where it sits lowest against the cluster's current top edge, breaking ties to
 * the left, which is what produces the staggered jigsaw look -- a big piece
 * leaves a shelf beside it, and the next small piece tucks into it instead of
 * starting a new row. Frames are placed largest first so the big pieces set the
 * structure and the small ones fill the gaps they leave.
 *
 * Deterministic: the same wall always arranges the same way.
 */
export function arrangeAesthetic({
  wallWidth,
  wallHeight,
  gap,
  frames,
}: ArrangeInput): Arrangement {
  if (frames.length === 0) {
    return { placements: [], contentHeight: 0, overflows: false };
  }

  const sorted = [...frames].sort(
    (a, b) => area(b) - area(a) || (a.id < b.id ? -1 : 1),
  );

  // Pack into a cluster narrower than the wall, shaped like the wall itself.
  // Given the full width the pack would just make one long row; constraining it
  // is what forces frames to stack and interlock into a mosaic.
  const totalArea = sorted.reduce(
    (sum, f) => sum + (f.width + gap) * (f.height + gap),
    0,
  );
  const widest = Math.max(...sorted.map((f) => f.width + gap));
  const clusterWidth = Math.min(
    wallWidth,
    Math.max(widest, Math.sqrt(totalArea * (wallWidth / wallHeight))),
  );

  let skyline: Skyline[] = [{ x: 0, width: clusterWidth, y: 0 }];
  const packed: Placement[] = [];

  for (const frame of sorted) {
    // Reserve the gap on the right and below, so neighbours never touch.
    const slotWidth = Math.min(frame.width + gap, clusterWidth);
    let best: { x: number; y: number } | null = null;

    for (const run of skyline) {
      for (const x of [run.x, run.x + run.width - slotWidth]) {
        if (x < 0 || x + slotWidth > clusterWidth + 1e-9) continue;
        const top = spanTop(skyline, x, slotWidth);
        if (top === null) continue;
        if (
          !best ||
          top < best.y - 1e-9 ||
          (Math.abs(top - best.y) < 1e-9 && x < best.x)
        ) {
          best = { x, y: top };
        }
      }
    }

    const spot = best ?? { x: 0, y: spanTop(skyline, 0, slotWidth) ?? 0 };
    packed.push({
      id: frame.id,
      x: spot.x,
      y: spot.y,
      width: frame.width,
      height: frame.height,
    });
    skyline = raise(skyline, spot.x, slotWidth, spot.y + frame.height + gap);
  }

  // Nudge each frame off the packing grid. Bottom-left packing snaps frames to
  // each other's edges, which reads as columns; a small deterministic stagger
  // breaks that into the loose salon look. The pack reserved a full gap around
  // every frame, so shifting by a third of one can never cause an overlap.
  const jitter = gap * 0.35;
  const staggered = packed.map((p) => ({
    ...p,
    x: p.x + (hash01(`${p.id}:x`) - 0.5) * 2 * jitter,
    y: p.y + (hash01(`${p.id}:y`) - 0.5) * 2 * jitter,
  }));
  packed.length = 0;
  packed.push(...staggered);

  // Centre the cluster as a block: the pack starts at the origin, so shift it by
  // whatever margin is left over on each axis.
  const left = Math.min(...packed.map((p) => p.x));
  const right = Math.max(...packed.map((p) => p.x + p.width));
  const top = Math.min(...packed.map((p) => p.y));
  const bottom = Math.max(...packed.map((p) => p.y + p.height));
  const contentHeight = bottom - top;
  const offsetX = (wallWidth - (right - left)) / 2 - left;
  const offsetY = (wallHeight - contentHeight) / 2 - top;

  const placements = packed.map((p) => ({
    ...p,
    x: p.x + offsetX,
    y: p.y + offsetY,
  }));

  const overflows = contentHeight > wallHeight || right - left > wallWidth;
  return { placements, contentHeight, overflows };
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

  const avgWidth = frames.reduce((sum, f) => sum + f.width, 0) / frames.length;
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
    return {
      id: "viewport",
      x: 0,
      y: 0,
      width: wall.width,
      height: wall.height,
    };
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

const clampScroll = (value: number, max: number): number =>
  Math.min(Math.max(value, 0), Math.max(0, max));

/**
 * The scroll offset that centres the zoomed window on a wall point, for driving
 * the pan when you drag inside the minimap. It's the inverse of
 * {@link viewportRect}: dropping the resulting scroll back through that helper
 * puts the viewport box's centre on the point (clamped at the wall's edges).
 * Returns the origin when nothing is scrollable.
 */
export function minimapPointToScroll(
  point: { x: number; y: number },
  m: ViewportMetrics,
  wall: { width: number; height: number },
): { scrollLeft: number; scrollTop: number } {
  if (m.scrollWidth <= 0 || m.scrollHeight <= 0) {
    return { scrollLeft: 0, scrollTop: 0 };
  }
  const scrollLeft = (point.x / wall.width) * m.scrollWidth - m.clientWidth / 2;
  const scrollTop =
    (point.y / wall.height) * m.scrollHeight - m.clientHeight / 2;
  return {
    scrollLeft: clampScroll(scrollLeft, m.scrollWidth - m.clientWidth),
    scrollTop: clampScroll(scrollTop, m.scrollHeight - m.clientHeight),
  };
}
