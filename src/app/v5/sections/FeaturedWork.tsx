"use client";

import Link from "next/link";
import { m } from "framer-motion";
import TextReveal from "@/components/motion/TextReveal";
import { FEATURES } from "@/app/_shared/featureData.data";
import { useHubReducedMotion } from "@/app/providers";
import { FEATURED } from "../featured";
import { SHELL, BAND } from "../shell";

const SPAN: Record<number, string> = {
  2: "md:col-span-2",
  4: "md:col-span-4",
  6: "md:col-span-6",
};

/**
 * Six items, six cells, three different widths.
 *
 * A grid of identical thirds is the single most recognisable generated-page
 * layout there is, so the two widest cells carry an accent wash and the four
 * narrow ones stay plain. That is also what keeps the section from being six
 * text boxes on one surface.
 */
export default function FeaturedWork() {
  const reducedMotion = useHubReducedMotion();
  const picks = FEATURED.flatMap((pick) => {
    const feature = FEATURES.find((f) => f.id === pick.id);
    return feature ? [{ ...pick, feature }] : [];
  });

  return (
    <section id="work" className={`${BAND} bg-surface/40`}>
      <div className={SHELL}>
        <TextReveal
          as="h2"
          className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Six of them, picked for what they prove
        </TextReveal>

        <div className="mt-10 grid gap-4 md:grid-cols-6">
          {picks.map(({ feature, pitch, span }, index) => {
            const wide = span > 2;
            return (
              <m.article
                key={feature.id}
                className={SPAN[span]}
                initial={reducedMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <Link
                  href={feature.href}
                  className="group flex h-full flex-col justify-between rounded-2xl border p-6 transition-colors focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
                  style={{
                    borderColor: `color-mix(in srgb, ${feature.color} 30%, var(--color-border))`,
                    background: wide
                      ? `linear-gradient(135deg, color-mix(in srgb, ${feature.color} 14%, transparent), transparent 65%)`
                      : undefined,
                  }}
                >
                  <div>
                    <h3
                      className={`font-display font-semibold tracking-tight ${wide ? "text-2xl sm:text-3xl" : "text-xl"}`}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className={`mt-3 leading-relaxed text-muted ${wide ? "max-w-[52ch]" : "text-sm"}`}
                    >
                      {pitch}
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="mt-6 inline-block text-sm transition-transform group-hover:translate-x-1"
                    style={{ color: `color-mix(in srgb, ${feature.color} 70%, var(--color-foreground))` }}
                  >
                    Open &rarr;
                  </span>
                </Link>
              </m.article>
            );
          })}
        </div>

        <p className="mt-8">
          <Link
            href="/discover"
            className="font-medium text-primary-700 underline underline-offset-4 hover:opacity-80 dark:text-primary-300"
          >
            All {FEATURES.length} apps, on a slot machine
          </Link>
        </p>
      </div>
    </section>
  );
}
