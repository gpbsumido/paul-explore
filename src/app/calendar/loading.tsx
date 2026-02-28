// Streams with the HTML shell so the browser has something to paint
// before the server fetch resolves. Mirrors CalendarGrid's month layout
// exactly -- 7 columns, 6 rows -- so there's no shift when real data arrives.

const GRID_COLS = 7;
const GRID_CELLS = 42; // 7 cols x 6 rows, month view is always this size
const LAST_ROW_START = 35; // cells 35-41 are the bottom row

export default function CalendarLoading() {
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
          style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: GRID_COLS }).map((_, i) => (
            <div key={i} className="py-2.5 flex justify-center">
              <div className="h-2.5 w-6 rounded bg-surface-raised animate-pulse" />
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: GRID_CELLS }).map((_, i) => {
            const isLastCol = (i + 1) % GRID_COLS === 0;
            const isLastRow = i >= LAST_ROW_START;
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
