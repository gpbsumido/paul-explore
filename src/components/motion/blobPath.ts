/**
 * Options for a single blob outline.
 */
export type BlobPathOptions = {
  /** Any integer. The same seed always produces the same outline. */
  seed: number;
  /** How many radial points to place around the circle. Defaults to 8. */
  points?: number;
  /** 0 is a perfect circle, 1 is as lumpy as it gets. Defaults to 0.4. */
  variance?: number;
  /** Width and height of the square viewBox the path is drawn for. */
  size?: number;
};

/**
 * mulberry32. Small, fast, and good enough for decoration. The point is that it
 * is seeded, so a blob is stable across renders and across server and client
 * rather than reshuffling on every paint.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Radius is kept under half the viewBox and every emitted number is clamped, so
 * a Catmull-Rom control point overshooting the hull still cannot leave the box
 * and leave a clipped edge showing.
 */
const clamp = (value: number, size: number): number =>
  Math.min(size, Math.max(0, value));

const round = (value: number): number => Math.round(value * 100) / 100;

/**
 * Build a closed, organic blob outline as an SVG path.
 *
 * Points are placed at even angles around a circle, each pushed in or out by a
 * seeded amount, then joined with Catmull-Rom curves converted to cubic beziers
 * so the loop closes smoothly instead of showing corners.
 *
 * Deterministic by design: BlobBackground renders the same markup on the server
 * and the client, and a random shape per render would hydrate mismatched.
 */
export function blobPath({
  seed,
  points = 8,
  variance = 0.4,
  size = 200,
}: BlobPathOptions): string {
  const random = mulberry32(seed);
  const center = size / 2;
  // 0.44 rather than 0.5 leaves room for the curve to bow outward past its
  // points without needing the clamp to bite and flatten an edge.
  const maxRadius = size * 0.44;

  const nodes = Array.from({ length: points }, (_, index) => {
    const step = (Math.PI * 2) / points;
    const angleJitter = (random() - 0.5) * step * 0.5 * variance;
    const angle = index * step + angleJitter;
    const radius = maxRadius * (1 - random() * 0.4 * variance);
    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    };
  });

  const at = (index: number) => nodes[(index + points) % points];

  const start = at(0);
  const segments = nodes.map((_, index) => {
    const p0 = at(index - 1);
    const p1 = at(index);
    const p2 = at(index + 1);
    const p3 = at(index + 2);

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    const coords = [c1x, c1y, c2x, c2y, p2.x, p2.y]
      .map((value) => round(clamp(value, size)))
      .join(" ");
    return `C ${coords}`;
  });

  const head = `M ${round(clamp(start.x, size))} ${round(clamp(start.y, size))}`;
  return `${head} ${segments.join(" ")} Z`;
}
