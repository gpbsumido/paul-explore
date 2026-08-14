"use client";

import Link from "next/link";
import { m } from "framer-motion";
import TextReveal from "@/components/motion/TextReveal";
import { CRAFT_TRAITS, type CraftTrait } from "@/lib/craft";
import { useHubReducedMotion } from "@/app/providers";
import { SHELL, BAND } from "../shell";

/**
 * One trait as a ledger row: an oversized index, the title, the principle,
 * then the pages that prove it.
 *
 * The first cut of this section was ten glass cards with a cursor glow, and
 * the glow washed the text out at exactly the moment someone leaned in. Here
 * the trait colour only ever touches things that are not text: the index
 * numeral, a rule that slides in along the left edge, and a wash held to
 * seven percent. Foreground copy stays on the semantic tokens in both themes,
 * so hovering changes the temperature of the row and never its legibility.
 */
function TraitRow({ trait, index }: { trait: CraftTrait; index: number }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute inset-y-3 left-0 w-0.5 origin-top scale-y-0 rounded-full bg-[var(--trait)] transition-transform duration-300 group-hover:scale-y-100"
      />
      <div className="grid gap-x-6 gap-y-3 rounded-r-2xl px-5 py-6 sm:grid-cols-[3.5rem_1fr] sm:px-7">
        <span
          aria-hidden="true"
          className="font-display text-2xl font-semibold tabular-nums text-[color-mix(in_srgb,var(--trait)_55%,var(--color-muted))] sm:text-3xl"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div>
          <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            {trait.title}
          </h3>
          <p className="mt-2 max-w-[62ch] leading-relaxed text-muted">
            {trait.principle}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {trait.evidence.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex rounded-full border border-border bg-surface/60 px-3.5 py-2 text-xs transition-colors hover:border-[color-mix(in_srgb,var(--trait)_45%,var(--color-border))] hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none sm:px-3 sm:py-1"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* The wash lives on its own layer so it can sit under the text without
          ever mixing into it. Seven percent of the trait colour is a tint the
          copy survives in both themes. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 rounded-r-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(90deg, color-mix(in srgb, var(--trait) 7%, transparent), transparent 70%)",
        }}
      />
    </>
  );
}

/**
 * The spine of the page: what a lead is measured on, all of them.
 *
 * A sticky rail holds the argument still on the left while the evidence
 * scrolls past as a single ledger on the right. Rows, not cards: ten glass
 * tiles in a grid read as a pricing page, and the numbering does the work the
 * grid was failing to do, which is to say this is a complete list and you are
 * somewhere inside it.
 */
export default function CraftSpine() {
  const reducedMotion = useHubReducedMotion();

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
            {CRAFT_TRAITS.length} traits, and for each one a page in this
            project you can open and check. Adjectives are cheap. These are
            not.
          </p>
          <Link
            href="/craft"
            className="mt-6 inline-flex items-center gap-1.5 font-medium text-primary-700 underline underline-offset-4 hover:opacity-80 dark:text-primary-300"
          >
            The full matrix
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <ul className="divide-y divide-border border-y border-border lg:col-span-8">
          {CRAFT_TRAITS.map((trait, index) => (
            <m.li
              key={trait.id}
              className="group relative"
              style={{ ["--trait" as string]: trait.color }}
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <TraitRow trait={trait} index={index} />
            </m.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
