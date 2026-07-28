import type { Placement } from "./_lib/arrange";
import type { FramedImage, Wall } from "./_lib/state";

type WallStageProps = {
  wall: Wall;
  placements: readonly Placement[];
  images: readonly FramedImage[];
};

/** Frame border thickness, in wall inches, so it scales with the preview. */
const FRAME_BORDER = 0.5;
/** Mat inset as a fraction of the frame's shorter side. */
const MAT_RATIO = 0.07;

/**
 * A to-scale preview of the gallery wall. The SVG viewBox is the wall's physical
 * size in inches, so a frame's inch dimensions map straight to viewBox units and
 * the whole thing scales to whatever width the container gives it without any
 * pixel math. Each frame is a white mat with a dark border and the photo cropped
 * to fill (object-fit: cover, via preserveAspectRatio slice).
 *
 * The stage is a single labelled `img` region rather than a pile of announced
 * shapes, so a screen reader hears one meaningful summary instead of decorative
 * rects.
 */
export default function WallStage({ wall, placements, images }: WallStageProps) {
  const srcById = new Map(images.map((image) => [image.id, image.src]));
  const label =
    placements.length === 0
      ? `Empty ${wall.width} by ${wall.height} inch wall`
      : `Gallery wall preview: ${placements.length} ${
          placements.length === 1 ? "frame" : "frames"
        } on a ${wall.width} by ${wall.height} inch wall`;

  return (
    <div
      className="w-full overflow-hidden rounded-lg"
      style={{ aspectRatio: `${wall.width} / ${wall.height}` }}
    >
      <svg
        role="img"
        aria-label={label}
        viewBox={`0 0 ${wall.width} ${wall.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
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
          return (
            <g key={placement.id}>
              <rect
                x={placement.x}
                y={placement.y}
                width={placement.width}
                height={placement.height}
                fill="#ffffff"
                stroke="#1f2937"
                strokeWidth={FRAME_BORDER}
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
            </g>
          );
        })}
      </svg>
    </div>
  );
}
