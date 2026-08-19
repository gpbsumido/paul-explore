"use client";

import { EVENT_COLORS } from "@/lib/calendar";

interface ColorSwatchPickerProps {
  /** The currently selected color. */
  value: string;
  /** Called with the chosen color when a swatch is clicked. */
  onChange: (color: string) => void;
  /** When true, the swatches are disabled and clicks are ignored. */
  disabled?: boolean;
}

/**
 * The row of color swatches shared by the event, countdown and calendar
 * modals. Each swatch is a circle that shows a checkmark when selected, and
 * announces itself as a toggle via aria-pressed.
 */
export default function ColorSwatchPicker({
  value,
  onChange,
  disabled,
}: ColorSwatchPickerProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {EVENT_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(c)}
          className="h-6 w-6 rounded-full inline-flex items-center justify-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          style={{ backgroundColor: c }}
          aria-label={`Color ${c}`}
          aria-pressed={value === c}
        >
          {value === c && (
            <svg
              width="10"
              height="8"
              viewBox="0 0 10 8"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1 4l2.5 2.5L9 1"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}
