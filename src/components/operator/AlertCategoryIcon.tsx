"use client";

import type { AlertCategory } from "@/types/operator";

interface AlertCategoryIconProps {
  category: AlertCategory;
}

/**
 * 16x16 icon for each alert category. Uses simple SVG paths so there's no
 * external icon dependency.
 */
export default function AlertCategoryIcon({
  category,
}: AlertCategoryIconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
      className="shrink-0 text-muted"
    >
      {PATHS[category]}
    </svg>
  );
}

const PATHS: Record<AlertCategory, React.ReactNode> = {
  "sensor-offline": (
    // wifi-off style
    <path d="M1.5 1.5l13 13M4.8 6.4A6.5 6.5 0 0 0 2 8.5l1.2 1a5 5 0 0 1 2-1.5m3.4-3.2A8 8 0 0 1 14 7l-1.2 1a6.5 6.5 0 0 0-3.2-1.8M6.2 10a3.5 3.5 0 0 1 3.6 0L8 12.5 6.2 10Z" />
  ),
  "low-stock": (
    // box with down arrow
    <path d="M2 4l6-2 6 2v8l-6 2-6-2V4zm6-2v12M2 4l6 2 6-2M8 8v3M6.5 9.5L8 11l1.5-1.5" />
  ),
  "temperature-warning": (
    // thermometer
    <path d="M9 1.5a1 1 0 0 0-2 0v8.03A2.5 2.5 0 1 0 9 9.53V1.5ZM8 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
  ),
  "door-ajar": (
    // door open
    <path d="M3 2h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3V2zm4 6.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM13 4v8" />
  ),
  "power-issue": (
    // lightning bolt
    <path d="M9.5 1.5L4 8.5h4L6.5 14.5 12 7.5H8L9.5 1.5Z" />
  ),
};
