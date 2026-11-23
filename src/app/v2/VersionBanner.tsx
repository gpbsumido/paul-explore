import Link from "next/link";

/**
 * Thin fixed banner over an archived landing generation. /discover is the only
 * caller, and every generation there is history, so it says what the caller
 * gives it rather than guessing at a sentence.
 */
export default function VersionBanner({ label }: { label: string }) {
  return (
    // A named region, not a bare div: the banner sits outside the page's main
    // landmark, and axe's region rule wants every piece of content inside one.
    <div
      role="region"
      aria-label="Landing page version"
      className="fixed top-0 right-0 left-0 z-50 border-b border-secondary-500/20 bg-secondary-500/25 py-2 text-center text-xs text-secondary-800 dark:text-secondary-200"
    >
      {label}.{" "}
      <Link href="/" className="underline underline-offset-2 hover:opacity-80">
        Switch to current &#8599;
      </Link>
    </div>
  );
}
