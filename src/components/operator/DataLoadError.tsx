"use client";

const EMAIL = "psumido@gmail.com";

interface DataLoadErrorProps {
  /** What could not be loaded, lower case: "inventory", "this store's sales". */
  what: string;
  /** The message the server gave, when it gave one worth showing. */
  detail?: string | null;
  onRetry?: () => void;
}

/**
 * Says that something failed to load, rather than letting it look like there is
 * nothing to show.
 *
 * The distinction matters more than it sounds. An operator who opens the Tax tab
 * and sees nothing concludes the store made no sales, and that is a conclusion
 * they might act on: not chasing a missing remittance, not questioning a number
 * that should have been there. An empty state is a claim about the world, and
 * making it when the truth is "the request failed" is the most expensive kind of
 * wrong, because nothing looks broken.
 *
 * So a failed load says so, says what failed, offers the retry that fixes the
 * common case, and gives a way to reach someone when it does not. Anyone can use
 * this dashboard without an account, which means nobody has a support channel by
 * default; without a contact route their only option is to assume the zero is
 * real and move on.
 */
export default function DataLoadError({
  what,
  detail,
  onRetry,
}: DataLoadErrorProps) {
  const subject = encodeURIComponent(
    `Operator dashboard: could not load ${what}`,
  );
  const body = encodeURIComponent(
    `I hit an error on the operator dashboard.\n\nWhat failed: ${what}\nDetail: ${detail ?? "none given"}\nPage: ${typeof window === "undefined" ? "" : window.location.href}\n`,
  );

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 rounded-xl border border-error-400/40 bg-error-500/5 px-4 py-8 text-center"
    >
      <p className="text-sm font-medium text-foreground">
        Could not load {what}
      </p>
      <p className="max-w-md text-xs text-muted">
        This is an error, not an empty store. Nothing here has been changed, so
        the numbers you were looking at are still safe.
      </p>
      {detail && <p className="max-w-md text-xs text-muted">{detail}</p>}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        )}
        <a
          href={`mailto:${EMAIL}?subject=${subject}&body=${body}`}
          className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:underline"
        >
          Tell me about it
        </a>
      </div>
    </div>
  );
}
