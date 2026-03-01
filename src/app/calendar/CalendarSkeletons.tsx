// Placeholder layouts shown while each calendar view's JS chunk downloads.
// Each skeleton matches the real view's dimensions so the page doesn't shift
// when the chunk arrives and swaps in -- that's what was tanking CLS.

// Mirrored from DayView.tsx so the skeleton stays in sync with the real view.
const DAY_ROW_HEIGHT = 44;
const DAY_GUTTER_WIDTH = "4.5rem";

// Mirrored from WeekView.tsx.
const WEEK_ROW_HEIGHT = 48;
const WEEK_DAY_COUNT = 7;

// Hour rows in a full day -- same for both day and week views.
const HOUR_COUNT = 24;

// Month grid dimensions -- 7 columns, always 6 rows (42 cells total).
const MONTH_COLS = 7;
const MONTH_CELLS = 42;
const MONTH_LAST_ROW_START = 35; // cells 35-41 are the bottom row

// How many mini month cards the year view renders.
const YEAR_MONTH_COUNT = 12;

/**
 * Skeleton for the month grid. Shared between the route-segment loading.tsx
 * (shown during the SSR stream) and the month view's own loading state.
 */
export function MonthSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
      {/* CalendarHeader skeleton */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="h-9 w-44 rounded-lg bg-surface animate-pulse" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-surface animate-pulse" />
            <div className="h-8 w-16 rounded-md bg-surface animate-pulse" />
            <div className="h-8 w-8 rounded-md bg-surface animate-pulse" />
          </div>
          <div className="h-8 w-52 rounded-lg bg-surface animate-pulse" />
        </div>
      </div>

      {/* Month grid */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Day-of-week label row */}
        <div
          className="grid border-b border-border bg-surface"
          style={{ gridTemplateColumns: `repeat(${MONTH_COLS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: MONTH_COLS }).map((_, i) => (
            <div key={i} className="py-2.5 flex justify-center">
              <div className="h-2.5 w-6 rounded bg-surface-raised animate-pulse" />
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
                  "min-h-[88px] sm:min-h-[100px] p-1.5",
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
 * Skeleton for the day view. Mirrors DayView's header block and 24-row time
 * grid at the exact same row height and gutter width.
 */
export function DaySkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Heading block */}
      <div className="px-4 pt-5 pb-4 border-b border-border">
        <div className="h-2.5 w-20 rounded bg-surface animate-pulse mb-1.5" />
        <div className="h-8 w-36 rounded bg-surface animate-pulse" />
      </div>

      {/* Time grid */}
      <div className="relative flex">
        {/* Hour label gutter -- width matches DayView's GUTTER_WIDTH */}
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
 * Skeleton for the week view. Mirrors WeekView's 7-column day headers and
 * 24-row time grid at the exact same row height.
 */
export function WeekSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-x-auto">
      {/* Column headers -- w-12 gutter spacer matches WeekView */}
      <div className="flex border-b border-border">
        <div className="w-12 shrink-0 border-r border-border" />
        {Array.from({ length: WEEK_DAY_COUNT }).map((_, i) => (
          <div
            key={i}
            className="flex-1 py-2 text-center border-r border-border last:border-r-0"
          >
            <div className="h-2.5 w-6 rounded bg-surface animate-pulse mx-auto mb-1.5" />
            <div className="h-7 w-7 rounded-full bg-surface animate-pulse mx-auto" />
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex">
        {/* Hour label gutter -- w-12 matches WeekView */}
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
 * Skeleton for the year view. Mirrors YearView's responsive 2/3/4-column grid
 * of 12 mini month cards -- each card has a month name, 7-col day labels, and
 * 6 rows of day circles.
 */
export function YearSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: YEAR_MONTH_COUNT }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-3">
          {/* Month name */}
          <div className="h-3 w-14 rounded bg-surface-raised animate-pulse mb-2.5" />

          {/* Day-of-week label row */}
          <div className="grid grid-cols-7 mb-1">
            {Array.from({ length: WEEK_DAY_COUNT }).map((_, j) => (
              <div key={j} className="flex justify-center">
                <div className="h-2 w-2.5 rounded bg-surface-raised animate-pulse" />
              </div>
            ))}
          </div>

          {/* Day cells -- 6 rows x 7 cols */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: MONTH_CELLS }).map((_, j) => (
              <div key={j} className="flex justify-center py-0.5">
                <div className="h-5 w-5 rounded-full bg-surface-raised animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
