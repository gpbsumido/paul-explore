// Placeholder layouts shown while each calendar view's JS chunk downloads.
// Each skeleton matches the real view's dimensions so the page doesn't shift
// when the chunk arrives and swaps in, which was what was tanking CLS.

// Mirrored from DayView.tsx so the skeleton stays in sync with the real view.
const DAY_ROW_HEIGHT = 44;
const DAY_GUTTER_WIDTH = "4.5rem";

// Mirrored from WeekView.tsx.
const WEEK_ROW_HEIGHT = 48;
const WEEK_DAY_COUNT = 7;

// Hour rows in a full day, same for both day and week views.
const HOUR_COUNT = 24;

// Month grid dimensions: 7 columns, always 6 rows (42 cells total).
const MONTH_COLS = 7;
const MONTH_CELLS = 42;
const MONTH_LAST_ROW_START = 35; // cells 35-41 are the bottom row

// How many mini month cards the year view renders.
const YEAR_MONTH_COUNT = 12;

/**
 * Skeleton for the month grid. Used in loading.tsx during the SSR stream and
 * as the month view's own loading state when switching back to month from another view.
 *
 * A few things to keep in sync with the real CalendarHeader + CalendarGrid:
 * the heading is text-2xl leading-none (24px mobile, 30px desktop), the gap
 * between heading and controls is space-y-2 (8px), and the DOW label cells
 * use py-2.5 with text-[10px] at 1.5 line-height which comes out to 35px total.
 * Month cells are fixed height now so nothing shifts when events load in.
 */
export function MonthSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
      {/* CalendarHeader skeleton, matches mb-6 space-y-2 heading + controls */}
      <div className="mb-6 flex flex-col gap-2">
        {/* Heading: text-2xl sm:text-3xl leading-none → h-6 (24px) / sm:h-[30px] (30px) */}
        <div className="h-6 sm:h-[30px] w-44 rounded-lg bg-surface animate-pulse" />
        {/* Controls: flex-wrap + gap-3 matches CalendarHeader */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: prev + today (h-8) + next */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-surface animate-pulse" />
            <div className="h-8 w-16 rounded-md bg-surface animate-pulse" />
            <div className="h-8 w-8 rounded-md bg-surface animate-pulse" />
          </div>
          {/* Right: Events link + separator + About link + separator + view switcher */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block h-4 w-10 rounded bg-surface animate-pulse" />
            <div className="hidden sm:block h-4 w-px bg-border" />
            <div className="hidden sm:block h-4 w-9 rounded bg-surface animate-pulse" />
            <div className="hidden sm:block h-4 w-px bg-border" />
            {/* View switcher: 3 buttons mobile (Day/Week/Month), 4 on sm+ (adds Year) */}
            <div className="h-8 w-[152px] sm:w-[208px] rounded-lg bg-surface animate-pulse" />
          </div>
        </div>
      </div>

      {/* Month grid */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Day-of-week label row, py-2.5 + text-[10px] at 1.5 line-height = 15px, total 35px */}
        <div
          className="grid border-b border-border bg-surface"
          style={{ gridTemplateColumns: `repeat(${MONTH_COLS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: MONTH_COLS }).map((_, i) => (
            <div key={i} className="py-2.5 flex justify-center">
              <div className="h-[15px] w-6 rounded bg-surface-raised animate-pulse" />
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${MONTH_COLS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: MONTH_CELLS }).map((_, i) => {
            const isLastCol = (i + 1) % MONTH_COLS === 0;
            const isLastRow = i >= MONTH_LAST_ROW_START;
            return (
              <div
                key={i}
                className={[
                  "h-[128px] sm:h-[132px] p-1.5 overflow-hidden",
                  "border-border",
                  isLastCol ? "" : "border-r",
                  isLastRow ? "" : "border-b",
                ].join(" ")}
              >
                <div className="h-7 w-7 rounded-full bg-surface animate-pulse" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for the day view. Mirrors DayView's header block and 24-row time grid.
 *
 * Heading height works out to 79px on mobile and 85px on desktop: pt-5 (20px),
 * day name text-[10px] at 1.5 line-height (15px), mb-1 (4px), then the date
 * which is text-2xl leading-none (24px) or sm:text-3xl leading-none (30px), pb-4 (16px).
 *
 * The all-day section in the real DayView is conditional on events, so we skip it
 * in the skeleton. That means there's still a small shift when the page loads and
 * all-day events exist, but it's not solvable without knowing the events ahead of time.
 */
export function DaySkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Heading block */}
      <div className="px-4 pt-5 pb-4 border-b border-border">
        <div className="h-[15px] w-20 rounded bg-surface animate-pulse mb-1" />
        <div className="h-6 sm:h-[30px] w-36 rounded bg-surface animate-pulse" />
      </div>

      {/* Time grid */}
      <div className="relative flex">
        {/* Hour label gutter, width matches DayView's GUTTER_WIDTH */}
        <div
          className="shrink-0 border-r border-border"
          style={{ width: DAY_GUTTER_WIDTH }}
        >
          {Array.from({ length: HOUR_COUNT }).map((_, i) => (
            <div
              key={i}
              className="flex items-start justify-end pr-2 pt-1.5 border-b border-border last:border-b-0"
              style={{ height: DAY_ROW_HEIGHT }}
            >
              <div className="h-2 w-8 rounded bg-surface animate-pulse" />
            </div>
          ))}
        </div>

        {/* Day column */}
        <div className="flex-1">
          {Array.from({ length: HOUR_COUNT }).map((_, i) => (
            <div
              key={i}
              className="border-b border-border last:border-b-0"
              style={{ height: DAY_ROW_HEIGHT }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for the week view, mirrors the 7-column day headers, the always-present
 * all-day row, and the 24-row time grid.
 *
 * A few dimensions to keep in sync with WeekView: each column header is py-2
 * (8px top and bottom) with a text-[10px] day name that inherits its text-xs
 * parent's line-height of 1rem (16px), an mt-0.5 (2px) gap, then a h-7 circle (28px),
 * coming out to 62px per header. The all-day row is always present in WeekView
 * regardless of events and has a min-h-[28px], so the skeleton always renders it too.
 * If all-day events are stacking in the real view, that row grows past 28px and
 * causes some unavoidable CLS. The time grid is 24 rows at 48px each, with a w-12
 * gutter on the left.
 */
export function WeekSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-x-auto">
      {/* Column headers, w-12 gutter spacer matches WeekView */}
      <div className="flex border-b border-border">
        <div className="w-12 shrink-0 border-r border-border" />
        {Array.from({ length: WEEK_DAY_COUNT }).map((_, i) => (
          <div
            key={i}
            className="flex-1 py-2 text-center border-r border-border last:border-r-0"
          >
            {/*
             * Day name: text-[10px] inside a text-xs parent, so it inherits
             * line-height: 1rem = 16px (not body 1.5 × 10 = 15px).
             */}
            <div className="h-4 w-6 rounded bg-surface animate-pulse mx-auto mb-0.5" />
            <div className="h-7 w-7 rounded-full bg-surface animate-pulse mx-auto" />
          </div>
        ))}
      </div>

      {/* All-day row, always present in WeekView regardless of events */}
      <div className="flex border-b border-border">
        <div className="w-12 shrink-0 border-r border-border" />
        <div className="flex-1 min-h-[28px]" />
      </div>

      {/* Time grid */}
      <div className="flex">
        {/* Hour label gutter, w-12 matches WeekView */}
        <div className="w-12 shrink-0 border-r border-border">
          {Array.from({ length: HOUR_COUNT }).map((_, i) => (
            <div
              key={i}
              className="flex items-start justify-end pr-2 pt-1.5 border-b border-border last:border-b-0"
              style={{ height: WEEK_ROW_HEIGHT }}
            >
              <div className="h-2 w-6 rounded bg-surface animate-pulse" />
            </div>
          ))}
        </div>

        {/* Day columns */}
        {Array.from({ length: WEEK_DAY_COUNT }).map((_, ci) => (
          <div key={ci} className="flex-1 border-r border-border last:border-r-0">
            {Array.from({ length: HOUR_COUNT }).map((_, ri) => (
              <div
                key={ri}
                className="border-b border-border last:border-b-0"
                style={{ height: WEEK_ROW_HEIGHT }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for the year view, mirrors YearView's responsive 2/3/4-column grid
 * of 12 mini month cards.
 *
 * Each card has p-3 (12px padding on each side). The month name is text-xs with
 * a 1rem line-height (16px) and mb-2 (8px) below it, so 24px total. DOW labels
 * and day cells share a single grid-cols-7 grid, same as the real YearView. DOW
 * cells are text-[8px] at body 1.5 line-height (12px) plus pb-1 (4px) = 16px each.
 * Day cells are h-[14px] with mb-0.5 (2px) margin-box, also 16px each. Seven rows
 * at 16px each = 112px total grid. Add padding on both sides and you get 160px
 * per card.
 *
 * One thing that's unavoidable: months with 5 calendar rows (35 days in the grid)
 * are shorter than the 42-cell version, so there's a small CLS when the real view
 * loads and shows the actual row count. Event dots add a few pixels per row when
 * events exist, which is also impossible to predict without knowing the data ahead
 * of time.
 */
export function YearSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: YEAR_MONTH_COUNT }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-3">
          {/* Month name: text-xs line-height = 16px, mb-2 = 8px */}
          <div className="h-4 w-14 rounded bg-surface-raised animate-pulse mb-2" />

          {/*
           * Single grid for DOW labels + day cells, matching real YearView exactly.
           * DOW cells: text-[8px] at body 1.5 line-height = 12px + pb-1 (4px) = 16px
           * Day cells: h-[14px] span + mb-0.5 (2px) margin-box = 16px
           */}
          <div className="grid grid-cols-7">
            {/* DOW label row */}
            {Array.from({ length: WEEK_DAY_COUNT }).map((_, j) => (
              <div key={`dow-${j}`} className="pb-1 flex justify-center">
                <div className="h-[12px] w-[8px] rounded bg-surface-raised animate-pulse" />
              </div>
            ))}
            {/* Day cell rows */}
            {Array.from({ length: MONTH_CELLS }).map((_, j) => (
              <div key={j} className="flex flex-col items-center mb-0.5">
                <div className="h-[14px] w-[14px] rounded-full bg-surface-raised animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
