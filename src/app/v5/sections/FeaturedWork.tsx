import Link from "next/link";
import TextReveal from "@/components/motion/TextReveal";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import { FEATURES } from "@/app/_shared/featureData.data";
import { FEATURED, previewSrc } from "../featured";
import { SHELL, BAND } from "../shell";

/**
 * The hover preview: the card's page, screenshotted per theme, fading up in
 * the bottom-right corner. Divs with background-image rather than img tags,
 * because a browser never downloads the background of a display:none element,
 * so each visitor fetches only their theme's set and only when the section
 * renders. Masked toward the corner so it reads as a peek, not a poster, and
 * held under the text layer so copy never sits on the screenshot.
 */
function CornerPreview({ id }: { id: string }) {
  const layer =
    "absolute inset-0 rounded-2xl bg-[length:72%_auto] bg-right-bottom bg-no-repeat";
  const mask =
    "[mask-image:radial-gradient(120%_120%_at_100%_100%,black,transparent_65%)]";
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-30 group-focus-within:opacity-30"
    >
      <span
        className={`${layer} ${mask} dark:hidden`}
        style={{ backgroundImage: `url(${previewSrc(id, "light")})` }}
      />
      <span
        className={`${layer} ${mask} hidden dark:block`}
        style={{ backgroundImage: `url(${previewSrc(id, "dark")})` }}
      />
    </span>
  );
}

const SPAN: Record<number, string> = {
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
};

/**
 * Six items, six cells, and no two rows built the same way: four and two, then
 * three and three, then two and four.
 *
 * The first shape this took had a middle row of three equal cells, which is the
 * single most recognisable generated-page layout there is. Widths that shift
 * row to row are what stop a grid reading as a template, and the two widest
 * cells carry an accent wash so the section is not six text boxes on one
 * surface.
 */
export default function FeaturedWork() {
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

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-6">
          {picks.map(({ feature, pitch, span }, index) => {
            const wide = span >= 4;
            return (
              <RevealOnScroll
                as="article"
                key={feature.id}
                className={SPAN[span]}
                y={24}
                amount={0.2}
                duration={0.5}
                delay={index * 0.05}
              >
                <Link
                  href={feature.href}
                  className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-colors focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
                  style={{
                    borderColor: `color-mix(in srgb, ${feature.color} 30%, var(--color-border))`,
                    background: wide
                      ? `linear-gradient(135deg, color-mix(in srgb, ${feature.color} 14%, transparent), transparent 65%)`
                      : undefined,
                  }}
                >
                  <CornerPreview id={feature.id} />
                  <div className="relative">
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
                    className="relative mt-6 inline-block text-sm transition-transform group-hover:translate-x-1"
                    style={{ color: `color-mix(in srgb, ${feature.color} 70%, var(--color-foreground))` }}
                  >
                    Open &rarr;
                  </span>
                </Link>
              </RevealOnScroll>
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
