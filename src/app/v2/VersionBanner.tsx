import Link from "next/link";

type Props = {
  version?: string;
  /**
   * Replaces the default sentence. /discover uses this: once v5 owned `/`,
   * every generation there became history, so the banner is a caption on all of
   * them rather than a warning about a stale one.
   */
  label?: string;
};

/** Thin fixed banner shown above a landing generation that is not the current one. */
export default function VersionBanner({ version, label }: Props) {
  return (
    // A named region, not a bare div: the banner sits outside the page's main
    // landmark, and axe's region rule wants every piece of content inside one.
    <div
      role="region"
      aria-label="Landing page version"
      className="fixed top-0 right-0 left-0 z-50 border-b border-secondary-500/20 bg-secondary-500/25 py-2 text-center text-xs text-secondary-800 dark:text-secondary-200"
    >
      {label ?? `You're viewing ${version ?? "an older version"}`}.{" "}
      <Link href="/" className="underline underline-offset-2 hover:opacity-80">
        Switch to current &#8599;
      </Link>
    </div>
  );
}
