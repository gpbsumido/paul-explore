// Crisp inline arrow/refresh icons for the landing. The Unicode glyphs (↗ ↘ ↑
// → ↻) render thin and uneven, especially small on mobile, so everything on the
// page uses these instead. They inherit currentColor and sit on the text line.
//
// display:inline-block is load-bearing: the design-system reset makes bare
// svgs display:block, which dropped a trailing arrow onto its own line in any
// inline-text context (nav links, the hero meta, the footer). Buttons use flex
// so they never showed it. inline-block keeps the icon on the text line
// everywhere while staying a flex item inside buttons.

type IconProps = { size?: number; className?: string };

function Icon({
  size = 16,
  className,
  d,
}: IconProps & { d: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ display: "inline-block", verticalAlign: "-0.125em" }}
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const ArrowUpRight = (p: IconProps) => (
  <Icon {...p} d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10" />
);
export const ArrowDownRight = (p: IconProps) => (
  <Icon {...p} d="M4.5 4.5 11.5 11.5M11.5 6v5.5H6" />
);
export const ArrowUp = (p: IconProps) => (
  <Icon {...p} d="M8 12.5V3.5M4.5 7 8 3.5 11.5 7" />
);
export const ArrowRight = (p: IconProps) => (
  <Icon {...p} d="M3 8h9.5M8.5 4 12.5 8 8.5 12" />
);
export const Refresh = (p: IconProps) => (
  <Icon
    {...p}
    d="M12.6 5.4A4.7 4.7 0 1 0 13.3 8M12.9 2.6 12.6 5.4 9.8 5.1"
  />
);
