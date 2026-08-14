"use client";

import Link from "next/link";
import SpotlightCard from "@/components/motion/SpotlightCard";
import TextReveal from "@/components/motion/TextReveal";
import { CRAFT_TRAITS, type CraftTrait } from "@/lib/craft";
import { SHELL, BAND } from "../shell";

/**
 * One trait, argued the way the /craft page argues it: the principle in plain
 * words, then the pages that prove it.
 *
 * The trait's colour reaches the accent prop and nothing else. It tints the
 * glass by five percent and drives the cursor glow, so ten accents across ten
 * cards still read as one page. Putting any of them on text would break both
 * the single-accent rule and, at these values, contrast.
 */
function TraitCard({ trait }: { trait: CraftTrait }) {
  return (
    <SpotlightCard accent={trait.color} className="p-6">
      <h3 className="text-lg font-semibold">{trait.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {trait.principle}
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {trait.evidence.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </SpotlightCard>
  );
}

/**
 * The spine of the page: what a lead is measured on, all ten of them.
 *
 * A sticky rail holds the argument still on the left while the evidence scrolls
 * past on the right, and the second column starts lower than the first so the
 * stack never lines up into a grid. Ten traits is more than a landing page
 * usually carries, and cutting to three would have made the section look like
 * every other feature row on the internet.
 */
export default function CraftSpine() {
  const left = CRAFT_TRAITS.filter((_, i) => i % 2 === 0);
  const right = CRAFT_TRAITS.filter((_, i) => i % 2 === 1);

  return (
    <section id="craft" className={BAND}>
      <div className={`${SHELL} grid gap-10 lg:grid-cols-12 lg:gap-14`}>
        <div className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          <TextReveal
            as="h2"
            className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            What a lead is actually measured on
          </TextReveal>
          <p className="mt-5 max-w-[38ch] leading-relaxed text-muted">
            Ten traits, and for each one a page in this project you can open and
            check. Adjectives are cheap. These are not.
          </p>
          <Link
            href="/craft"
            className="mt-6 inline-flex items-center gap-1.5 font-medium text-primary-700 underline underline-offset-4 hover:opacity-80 dark:text-primary-300"
          >
            The full matrix
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-8">
          <div className="flex flex-col gap-5">
            {left.map((trait) => (
              <TraitCard key={trait.id} trait={trait} />
            ))}
          </div>
          <div className="flex flex-col gap-5 sm:mt-16">
            {right.map((trait) => (
              <TraitCard key={trait.id} trait={trait} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
