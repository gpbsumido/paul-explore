// Placeholder layouts shown while each calendar view's JS chunk downloads.

const DAY_ROW_HEIGHT = 48;
const DAY_GUTTER_WIDTH = "4.5rem";
const WEEK_ROW_HEIGHT = 48;
const WEEK_DAY_COUNT = 7;
const HOUR_COUNT = 24;
const MONTH_COLS = 7;
const MONTH_CELLS = 42;
const MONTH_LAST_ROW_START = 35;
const YEAR_MONTH_COUNT = 12;

/**
 * Skeleton for the month grid — used in loading.tsx and when switching back to month view.
 */
export function MonthSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-8">
      {/* CalendarHeader skeleton */}
      <div className="mb-6 flex flex-col gap-2">
        <div className="h-6 sm:h-[30px] w-44 rounded-lg bg-surface animate-pulse" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-surface animate-pulse" />
            <div className="h-8 w-16 rounded-md bg-surface animate-pulse" />
            <div className="h-8 w-8 rounded-md bg-surface animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block h-4 w-10 rounded bg-surface animate-pulse" />
            <div className="hidden sm:block h-4 w-px bg-border" />
            <div className="hidden sm:block h-4 w-9 rounded bg-surface animate-pulse" />
            <div className="hidden sm:block h-4 w-px bg-border" />
            <div className="h-8 w-[152px] sm:w-[208px] rounded-lg bg-surface animate-pulse" />
          </div>
        </div>
      </div>

      {/* Month grid */}
      <div className="rounded-xl border border-border overflow-hidden">
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
                  "h-[128px] sm:h-[132px] p-1.5 overflow-hidden border-border",
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
 * Skeleton for one day — mirrors DayView's header + full-height time grid.
 */
export function DaySkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="px-4 pt-5 pb-4 border-b border-border">
        <div className="h-[15px] w-20 rounded bg-surface animate-pulse mb-1" />
        <div className="h-6 sm:h-[30px] w-36 rounded bg-surface animate-pulse" />
      </div>
      <div className="relative flex">
        <div className="shrink-0 border-r border-border" style={{ width: DAY_GUTTER_WIDTH }}>
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
 * Skeleton for one week — mirrors WeekView's column headers, all-day row, and time grid.
 */
export function WeekSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="flex border-b border-border">
          <div className="w-12 shrink-0 border-r border-border" />
          {Array.from({ length: WEEK_DAY_COUNT }).map((_, i) => (
            <div
              key={i}
              className="flex-1 py-2 text-center border-r border-border last:border-r-0"
            >
              <div className="h-4 w-6 rounded bg-surface animate-pulse mx-auto mb-0.5" />
              <div className="h-7 w-7 rounded-full bg-surface animate-pulse mx-auto" />
            </div>
          ))}
        </div>
        <div className="flex border-b border-border">
          <div className="w-12 shrink-0 border-r border-border" />
          <div className="flex-1 min-h-[28px]" />
        </div>
        <div className="flex">
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
    </div>
  );
}

/**
 * Skeleton for the year view — mirrors YearView's outer panel and 2/3/4-column mini-month grid.
 */
export function YearSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden p-3 sm:p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: YEAR_MONTH_COUNT }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-3">
            <div className="h-4 w-14 rounded bg-surface-raised animate-pulse mb-2" />
            <div className="grid grid-cols-7">
              {Array.from({ length: WEEK_DAY_COUNT }).map((_, j) => (
                <div key={`dow-${j}`} className="pb-1 flex justify-center">
                  <div className="h-[12px] w-[8px] rounded bg-surface-raised animate-pulse" />
                </div>
              ))}
              {Array.from({ length: MONTH_CELLS }).map((_, j) => (
                <div key={j} className="flex flex-col items-center mb-0.5">
                  <div className="h-[14px] w-[14px] rounded-full bg-surface-raised animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
