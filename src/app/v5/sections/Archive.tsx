import Link from "next/link";
import GradientMesh from "@/components/motion/GradientMesh";
import TextScramble from "@/components/motion/TextScramble";
import { ARCHIVED_VERSIONS } from "@/app/discover/archive";
import { SHELL, BAND } from "../shell";

/**
 * The landing pages that came before this one.
 *
 * Not nostalgia. Four full redesigns of the same page, each still running at
 * its own URL, is the clearest evidence on the site that I ship a rewrite and
 * then live with it. The scramble is the one place on the page where the motion
 * is the content: the heading decodes into the count.
 */
export default function Archive() {
  return (
    <section id="archive" className={`${BAND} relative overflow-hidden`}>
      <GradientMesh
        colors={[
          "var(--color-primary-500)",
          "var(--color-secondary-400)",
          "var(--color-primary-800)",
        ]}
        speedMs={24000}
        className="-z-10 opacity-[0.18]"
      />
      <div className={`${SHELL} max-w-3xl`}>
        <TextScramble
          as="h2"
          text={`Before this one, there were ${ARCHIVED_VERSIONS.length} landing pages`}
          trigger="inView"
          speedMs={22}
          className="font-display block text-3xl font-semibold tracking-tight sm:text-4xl"
        />
        <p className="mt-5 leading-relaxed text-muted">
          A node graph, a slot machine, and two before those. They all still
          run, banner and all, so you can watch the taste change instead of
          taking my word for it.
        </p>
        <Link
          href="/discover?version=v4"
          className="mt-7 inline-flex h-11 items-center rounded-full border border-border bg-surface/70 px-6 font-medium backdrop-blur-sm transition-colors hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none active:translate-y-px"
        >
          Spin through the archive
        </Link>
      </div>
    </section>
  );
}
