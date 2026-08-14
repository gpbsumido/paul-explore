"use client";

import Link from "next/link";
import TextReveal from "@/components/motion/TextReveal";
import { THOUGHTS } from "@/app/_shared/featureData.data";
import { FEATURED_WRITING } from "../featured";
import { SHELL, BAND } from "../shell";

/**
 * Three write-ups, as full-width rows rather than cards.
 *
 * The bento above already used a grid, and a page that reaches for the same
 * layout twice reads as a template. Titles come from the THOUGHTS registry so
 * a rename upstream cannot leave a stale one here.
 */
export default function Writing() {
  const rows = FEATURED_WRITING.flatMap((pick) => {
    const thought = THOUGHTS.find((t) => t.href === pick.href);
    return thought ? [{ ...pick, title: thought.title }] : [];
  });

  return (
    <section id="writing" className={BAND}>
      <div className={SHELL}>
        <TextReveal
          as="h2"
          className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          The reasoning, written down while it was fresh
        </TextReveal>

        <ul className="mt-10 divide-y divide-border border-t border-border">
          {rows.map((row) => (
            <li key={row.href}>
              <Link
                href={row.href}
                className="group flex flex-col gap-2 py-7 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none sm:flex-row sm:items-baseline sm:gap-10"
              >
                <h3 className="font-display text-2xl font-semibold tracking-tight transition-colors group-hover:text-primary-700 sm:w-[38%] sm:shrink-0 dark:group-hover:text-primary-300">
                  {row.title}
                </h3>
                <p className="leading-relaxed text-muted">{row.pitch}</p>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-8">
          <Link
            href="/thoughts"
            className="font-medium text-primary-700 underline underline-offset-4 hover:opacity-80 dark:text-primary-300"
          >
            Every write-up on this site
          </Link>
        </p>
      </div>
    </section>
  );
}
