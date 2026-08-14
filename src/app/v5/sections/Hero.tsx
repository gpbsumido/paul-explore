"use client";

import Link from "next/link";
import BlobBackground from "@/components/motion/BlobBackground";
import MagneticButton from "@/components/motion/MagneticButton";
import HeroScene from "../HeroScene";
import { SHELL } from "../shell";

/**
 * Entrances above the fold are CSS, never framer.
 *
 * framer's `initial` ships the largest text on the page as `opacity: 0` in the
 * server HTML, and LCP then waits for hydration. `.reveal-up` animates from a
 * stylesheet the browser already has, so the headline is painted and readable
 * on the first frame either way. Each element carries its own delay, which is
 * what makes the stagger.
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
export default function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative flex min-h-[100dvh] items-center overflow-hidden pt-24 pb-16"
    >
      <BlobBackground
        seeds={[3, 7]}
        colors={[
          "var(--color-primary-400)",
          "var(--color-secondary-400)",
        ]}
        parallax={60}
        className="-z-10"
      />

      <div className={`${SHELL} grid items-center gap-12 lg:grid-cols-12`}>
        <div className="lg:col-span-7">
          <h1
            id="hero-title"
            className="reveal-up font-display text-5xl leading-[0.95] font-semibold tracking-tight sm:text-6xl lg:text-7xl"
            style={rise(0)}
          >
            Paul Sumido
          </h1>

          <p
            className="reveal-up mt-4 text-xl font-medium text-primary-700 sm:text-2xl dark:text-primary-300"
            style={rise(90)}
          >
            Lead Frontend Developer
          </p>

          <p
            className="reveal-up mt-6 max-w-[34ch] text-lg leading-relaxed text-muted sm:text-xl"
            style={rise(180)}
          >
            Ten minutes is all most people give a portfolio. This one argues
            from shipped work and the write-ups behind it.
          </p>

          <div
            className="reveal-up mt-10 flex flex-wrap items-center gap-3"
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
