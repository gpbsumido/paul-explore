"use client";

import Link from "next/link";
import BlobBackground from "@/components/motion/BlobBackground";
import MagneticButton from "@/components/motion/MagneticButton";
import HeroScene from "../HeroScene";
import { HERO_TAGLINES } from "../taglines";
import { SHELL } from "../shell";

/**
 * Entrances above the fold slide, they never fade.
 *
 * The heading here is the page's LCP element, and Chrome does not count an
 * element as painted until it is visible. Anything that starts at `opacity: 0`
 * — framer's `initial`, or `.reveal-up`'s keyframe — therefore defers LCP until
 * the fade runs, which on a busy main thread is seconds after first paint. So
 * the above-the-fold text uses `.rise-in`: the same slide on transform alone,
 * opacity held at 1, painted on the first frame. Each element carries its own
 * delay, which is what makes the stagger. `.reveal-up` still drives the scene
 * on the right, which is below the LCP text and free to fade.
 */
const rise = (ms: number) => ({ animationDelay: `${ms}ms` });

/**
 * The hero: name, role, one sentence, two ways in.
 *
 * Deliberately not centred. The type sits in the left seven columns and the
 * object in the right five, and the sentence runs short of the column edge so
 * the right side stays ragged. A centred stack over a gradient is the layout
 * every generated portfolio arrives at, and this page's whole argument is that
 * I do not arrive at the default.
 */
export default function Hero({ taglineIndex = 0 }: { taglineIndex?: number }) {
  const tagline =
    HERO_TAGLINES[taglineIndex] ?? HERO_TAGLINES[0];

  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative flex min-h-[calc(100dvh-4rem)] items-center overflow-hidden pt-16 pb-16"
    >
      {/* Held to a third of its natural strength and pushed off the left edge.
          At full opacity across the whole viewport it stops being a texture and
          becomes a centred gradient wash, which is the single most recognisable
          generated-hero background there is. */}
      {/* light-dark(): paper needs deeper hues at more presence or the haze
          reads as a stain; near-black wants the lighter pair held back. The
          browser picks per theme because color-scheme is already set. */}
      <BlobBackground
        seeds={[3, 7]}
        colors={[
          "light-dark(var(--color-primary-600), var(--color-primary-400))",
          "light-dark(var(--color-primary-500), var(--color-secondary-400))",
        ]}
        parallax={60}
        className="-z-10 left-[35%] opacity-50 dark:opacity-35 [mask-image:linear-gradient(90deg,transparent,black_22%)]"
      />

      <div className={`${SHELL} grid items-center gap-12 lg:grid-cols-12`}>
        <div className="lg:col-span-7">
          <h1
            id="hero-title"
            className="rise-in font-display text-5xl leading-[0.95] font-semibold tracking-tight sm:text-6xl lg:text-7xl"
            style={rise(0)}
          >
            Paul Sumido
          </h1>

          <p
            className="rise-in mt-4 text-xl font-medium text-primary-700 sm:text-2xl dark:text-primary-300"
            style={rise(90)}
          >
            Lead Frontend Developer
          </p>

          <p
            className="rise-in mt-6 max-w-[38ch] text-lg leading-relaxed text-muted sm:text-xl"
            style={rise(180)}
          >
            {tagline}
          </p>

          <div
            className="rise-in mt-10 flex flex-wrap items-center gap-3"
            style={rise(270)}
          >
            <MagneticButton strength={0.3}>
              <Link
                href="/resume"
                className="inline-flex h-12 items-center rounded-full bg-primary-600 px-7 font-medium text-white transition-colors hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:translate-y-px"
              >
                Resume
              </Link>
            </MagneticButton>
            <a
              href="#work"
              className="inline-flex h-12 items-center rounded-full border border-border bg-surface/70 px-7 font-medium backdrop-blur-sm transition-colors hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:translate-y-px"
            >
              See the work
            </a>
          </div>
        </div>

        <div className="reveal-up lg:col-span-5" style={rise(360)}>
          <HeroScene />
        </div>
      </div>
    </section>
  );
}
