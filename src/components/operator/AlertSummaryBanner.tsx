interface AlertSummaryBannerProps {
  criticalCount: number;
  warningCount: number;
  onFilterCritical: () => void;
  onFilterWarning: () => void;
}

/**
 * Top-of-page banner showing fleet-wide alert counts. Each count is clickable
 * to filter the fleet view down to stores with that severity. Only renders when
 * there are active alerts — a quiet fleet shows no banner.
 */
export default function AlertSummaryBanner({
  criticalCount,
  warningCount,
  onFilterCritical,
  onFilterWarning,
}: AlertSummaryBannerProps) {
  if (criticalCount === 0 && warningCount === 0) return null;

  return (
    <div
      className={`flex items-center gap-4 rounded-lg border px-4 py-3 text-sm ${
        criticalCount > 0
          ? "border-error-300 bg-error-50 dark:border-error-800 dark:bg-error-950/40"
          : "border-warning-300 bg-warning-50 dark:border-warning-800 dark:bg-warning-950/40"
      }`}
      role="status"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="currentColor"
        className={criticalCount > 0 ? "text-error-500" : "text-warning-500"}
        aria-hidden
      >
        <path d="M8 1a1 1 0 0 1 .867.5l6.062 10.5A1 1 0 0 1 14.062 13.5H1.938a1 1 0 0 1-.867-1.5L7.133 1.5A1 1 0 0 1 8 1Zm0 4.5a.75.75 0 0 0-.75.75v2.5a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8 5.5ZM8 11a.75.75 0 1 0 0-1.5A.75.75 0 0 0 8 11Z" />
      </svg>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {criticalCount > 0 && (
          <button
            type="button"
            onClick={onFilterCritical}
            className="rounded font-medium text-error-700 hover:text-error-800 dark:text-error-400 dark:hover:text-error-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            {criticalCount} critical
          </button>
        )}
        {warningCount > 0 && (
          <button
            type="button"
            onClick={onFilterWarning}
            className="rounded font-medium text-warning-700 hover:text-warning-800 dark:text-warning-400 dark:hover:text-warning-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            {warningCount} warning{warningCount !== 1 ? "s" : ""}
          </button>
        )}
        <span className="text-muted">across fleet</span>
      </div>
    </div>
  );
}
