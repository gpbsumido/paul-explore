/**
 * A design-system chart tooltip, so every demo's recharts chart reads like the
 * rest of the app instead of the raw white default. Pass it to a recharts
 * `<Tooltip content={<ChartTooltip accent={...} />} />`. The accent tints the
 * value so it matches the chart it's describing. recharts injects `active`,
 * `payload`, and `label`, so those are optional here.
 */
type TooltipEntry = {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
};

export function ChartTooltip({
  active,
  payload,
  label,
  accent,
  formatValue,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  accent?: string;
  formatValue?: (value: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-surface-raised/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      {label != null && label !== "" && (
        <p className="mb-1 text-[10px] font-medium tracking-wide text-muted uppercase">
          {label}
        </p>
      )}
      <div className="space-y-0.5">
        {payload.map((entry, i) => {
          const value = typeof entry.value === "number" ? entry.value : Number(entry.value);
          return (
            <div
              key={`${entry.dataKey ?? i}`}
              className="flex items-center gap-2 font-mono text-[13px] tabular-nums"
            >
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: accent ?? entry.color ?? "currentColor" }}
              />
              {entry.name != null && entry.name !== entry.dataKey && (
                <span className="text-muted">{entry.name}</span>
              )}
              <span className="font-semibold text-foreground">
                {formatValue ? formatValue(value) : value.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
