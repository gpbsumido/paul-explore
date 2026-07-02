type IconProps = {
  size?: number;
  className?: string;
};

/** Downward arrow into a surface -- used for restock actions */
export function RestockIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <path
        d="M8 2v12M4 10l4 4 4-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Simple checkmark -- used for dismiss / acknowledge actions */
export function CheckmarkIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Circular arrow -- used for refresh / reload actions */
export function RefreshIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <path d="M14 8A6 6 0 1 1 8 2" strokeLinecap="round" />
      <path d="M8 0l3 2-3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Filled warning triangle with exclamation mark */
export function WarningTriangleIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M8 1a1 1 0 0 1 .867.5l6.062 10.5A1 1 0 0 1 14.062 13.5H1.938a1 1 0 0 1-.867-1.5L7.133 1.5A1 1 0 0 1 8 1Zm0 4.5a.75.75 0 0 0-.75.75v2.5a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8 5.5ZM8 11a.75.75 0 1 0 0-1.5A.75.75 0 0 0 8 11Z" />
    </svg>
  );
}

/** Checkmark inside a circle -- used for "all clear" empty states */
export function CheckCircleIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 8l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Downward-pointing chevron -- rotatable for expand/collapse toggles */
export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/** X mark -- used for offline / disconnected state */
export function OfflineXIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

type SignalBarsIconProps = IconProps & {
  bars: number;
};

/** 3-bar signal strength indicator with dynamic opacity per bar */
export function SignalBarsIcon({
  size = 14,
  bars,
  className,
}: SignalBarsIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <rect
        x="1"
        y="11"
        width="3"
        height="4"
        rx="0.5"
        opacity={bars >= 1 ? 1 : 0.2}
      />
      <rect
        x="6"
        y="7"
        width="3"
        height="8"
        rx="0.5"
        opacity={bars >= 2 ? 1 : 0.2}
      />
      <rect
        x="11"
        y="3"
        width="3"
        height="12"
        rx="0.5"
        opacity={bars >= 3 ? 1 : 0.2}
      />
    </svg>
  );
}
