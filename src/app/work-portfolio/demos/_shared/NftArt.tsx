import { makeRng } from "./mock";

/**
 * Deterministic generative art for an NFT thumbnail, so the inventory reads like
 * a real collection instead of flat colour swatches. Same seed → same piece:
 * a two-tone gradient ground with a few layered shapes, the way on-chain
 * generative collections (Art Blocks and friends) actually look.
 */
export function NftArt({
  seed,
  className,
}: {
  seed: number;
  className?: string;
}) {
  const rng = makeRng(Math.floor(seed) || 1);
  const h1 = Math.floor(rng() * 360);
  const h2 = (h1 + 60 + Math.floor(rng() * 150)) % 360;
  const gid = `nft-g-${Math.floor(seed)}`;
  const rot = Math.floor(rng() * 360);

  const shapes = Array.from({ length: 4 }, (_, i) => {
    const kind = rng();
    const hue = (h1 + (rng() - 0.5) * 80 + 360) % 360;
    return {
      i,
      kind,
      cx: 15 + rng() * 70,
      cy: 15 + rng() * 70,
      r: 10 + rng() * 34,
      color: `hsl(${hue} ${45 + rng() * 30}% ${45 + rng() * 25}%)`,
      opacity: 0.35 + rng() * 0.5,
      rotate: rng() * 360,
    };
  });

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1" gradientTransform={`rotate(${rot} .5 .5)`}>
          <stop offset="0%" stopColor={`hsl(${h1} 55% 42%)`} />
          <stop offset="100%" stopColor={`hsl(${h2} 60% 30%)`} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${gid})`} />
      {shapes.map((s) =>
        s.kind < 0.4 ? (
          <circle key={s.i} cx={s.cx} cy={s.cy} r={s.r} fill={s.color} opacity={s.opacity} />
        ) : s.kind < 0.72 ? (
          <rect
            key={s.i}
            x={s.cx - s.r}
            y={s.cy - s.r}
            width={s.r * 2}
            height={s.r * 2}
            rx={s.r * 0.2}
            fill={s.color}
            opacity={s.opacity}
            transform={`rotate(${s.rotate} ${s.cx} ${s.cy})`}
          />
        ) : (
          <circle
            key={s.i}
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill="none"
            stroke={s.color}
            strokeWidth={2 + (s.i % 3)}
            opacity={s.opacity}
          />
        ),
      )}
      {/* a soft top highlight so it catches light like a rendered piece */}
      <rect width="100" height="40" fill="white" opacity="0.06" />
    </svg>
  );
}
