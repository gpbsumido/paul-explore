import Link from "next/link";

/** Thin fixed banner shown when viewing a retired version of the landing/hub. */
export default function VersionBanner({ version }: { version?: string }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-secondary-500/20 bg-secondary-500/25 py-2 text-center text-xs text-secondary-800 dark:text-secondary-200">
      You&apos;re viewing {version ?? "an older version"} &mdash;{" "}
      <Link href="/" className="underline underline-offset-2 hover:opacity-80">
        switch to current &#8599;
      </Link>
    </div>
  );
}
