"use client";

import { useSyncExternalStore } from "react";
import { m, useReducedMotion } from "framer-motion";
import {
  spring,
  fadeInUp,
  staggerContainer,
  instantTransition,
} from "@/lib/animations";
import styles from "./hero.module.css";

const LINES = ["Hey, I'm Paul.", "I build things", "people use."];

export default function HeroSection() {
  // SSR renders text visible (initial={false} server-side preserves LCP).
  // Animation only runs after hydration on the client.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const prefersReduced = useReducedMotion();
  const skip = prefersReduced ?? false;
  const transition = skip ? instantTransition : spring.wordReveal;

  const words = LINES.flatMap((line, lineIdx) =>
    line.split(" ").map((word, wordIdx) => ({
      word,
      lineIdx,
      key: `${lineIdx}-${wordIdx}`,
      isLastInLine: wordIdx === line.split(" ").length - 1,
    })),
  );

  // total word count drives the subtitle/CTA delay
  const wordCount = words.length;
  const staggerDelay = skip ? 0 : 0.08;
  const afterHeadlineDelay = skip ? 0 : wordCount * staggerDelay + 0.2;

  // min-h-svh (small viewport), not dvh. dvh grows when the mobile URL bar
  // hides on scroll, which resizes the hero and pushes every section below it
  // down, a layout shift that shows up as CLS. svh is the stable smallest
  // viewport height, so the hero never resizes mid-scroll.
  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* CSS-only ambient gradient background */}
      <div className={styles.gradient} />

      <div className="relative z-10 max-w-3xl">
        {/* Badge pill */}
        <m.p
          className="mb-6 inline-block rounded-full border border-border bg-surface/50 px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-muted"
          initial={mounted ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={
            skip ? instantTransition : { ...spring.smooth, delay: 0.1 }
          }
        >
          Full-Stack Engineer
        </m.p>

        {/* Headline with staggered word reveal */}
        <m.h1
          className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          style={{ perspective: 800 }}
          variants={staggerContainer(staggerDelay)}
          initial={mounted ? "hidden" : false}
          animate="visible"
        >
          {words.map(({ word, lineIdx, key, isLastInLine }) => (
            <span key={key}>
              <m.span
                className="inline-block"
                variants={fadeInUp}
                transition={transition}
              >
                {word}
              </m.span>
              {isLastInLine && lineIdx < LINES.length - 1 ? (
                <br />
              ) : (
                !isLastInLine && " "
              )}
            </span>
          ))}
        </m.h1>

        {/* Subtitle */}
        <m.p
          className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted"
          initial={mounted ? { opacity: 0, y: 14 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={
            skip
              ? instantTransition
              : { ...spring.smooth, delay: afterHeadlineDelay }
          }
        >
          Software engineer who ships real products — from fantasy sports
          dashboards to fleet management systems. Every feature tested, every
          metric tracked.
        </m.p>

        {/* CTA */}
        <m.button
          className="mt-8 rounded-full border border-border bg-foreground px-8 py-3 text-sm font-medium text-background transition-opacity hover:opacity-80"
          initial={mounted ? { opacity: 0, y: 14 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={
            skip
              ? instantTransition
              : { ...spring.smooth, delay: afterHeadlineDelay + 0.15 }
          }
          onClick={() =>
            document
              .getElementById("projects")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Explore my work ↓
        </m.button>
      </div>

      {/* Scroll indicator */}
      <m.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={mounted ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={
          skip
            ? instantTransition
            : { ...spring.gentle, delay: afterHeadlineDelay + 0.4 }
        }
      >
        <m.div
          className="h-8 w-[1px] bg-muted/40"
          animate={skip ? {} : { y: [0, 8, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </m.div>
    </section>
  );
}
