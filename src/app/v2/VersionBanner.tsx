import Link from "next/link";

/** Thin fixed banner shown when viewing a retired version of the landing/hub. */
export default function VersionBanner({ version }: { version?: string }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-amber-500/20 bg-amber-500/30 py-2 text-center text-xs text-amber-700 dark:text-amber-300">
      You&apos;re viewing {version ?? "an older version"} &mdash;{" "}
      <Link href="/" className="underline underline-offset-2 hover:opacity-80">
        switch to current &#8599;
      </Link>
    </div>
  );
}
