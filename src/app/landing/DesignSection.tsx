"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import Section from "./Section";
import { spring, instantTransition } from "@/lib/animations";

const headingWipe = {
  hidden: { clipPath: "inset(0 100% 0 0)" },
  visible: { clipPath: "inset(0 0% 0 0)" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

const SWATCHES = [
  ["bg-primary-400", "P400"],
  ["bg-primary-500", "P500"],
  ["bg-primary-600", "P600"],
  ["bg-secondary-400", "S400"],
  ["bg-secondary-500", "S500"],
  ["bg-secondary-600", "S600"],
  ["bg-neutral-300 dark:bg-neutral-600", "N"],
  ["bg-error-500", "Err"],
  ["bg-success-500", "Ok"],
  ["bg-warning-500", "Warn"],
] as const;

const RADII = ["sm", "md", "lg", "xl", "2xl", "full"] as const;

export default function DesignSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const prefersReduced = useReducedMotion();
  const transition = prefersReduced ? instantTransition : undefined;

  return (
    <Section
      className="bg-black"
      glow="radial-gradient(ellipse at 80% 50%, color-mix(in srgb, var(--color-feature-motion) 5%, transparent) 0%, transparent 60%)"
    >
      <div ref={ref}>
        <motion.h2
          className="text-center text-3xl font-bold tracking-tight text-white md:text-4xl"
          variants={headingWipe}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth }}
        >
          Design System
        </motion.h2>

        <motion.p
          className="mx-auto mt-3 max-w-lg text-center text-white/70"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.1 }}
        >
          A token-driven palette with semantic color aliases, consistent
          spacing, and theme toggling.
        </motion.p>

        {/* color swatches — each scatters in from a deterministic offset */}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {SWATCHES.map(([bg, label], i) => (
            <motion.div
              key={label}
              className="flex flex-col items-center gap-1"
              initial={prefersReduced ? { opacity: 0 } : {
                x: ((i % 3) - 1) * 30,
                y: Math.sin(i * 1.7) * 20,
                rotate: Math.cos(i * 2.3) * 12,
                scale: 0.7,
                opacity: 0,
              }}
              animate={inView
                ? { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }
                : undefined
              }
              transition={prefersReduced
                ? { ...instantTransition }
                : { ...spring.bounce, delay: i * 0.04 }
              }
            >
              <div className={`h-10 w-10 rounded-lg ${bg} shadow-sm`} />
              <span className="text-[10px] text-white/50">{label}</span>
            </motion.div>
          ))}
        </div>

        {/* button variants */}
        <motion.div
          className="mt-10 flex flex-wrap justify-center gap-3"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.3 }}
        >
          <span className="inline-flex items-center rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background">
            Primary
          </span>
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm font-medium text-white">
            Secondary
          </span>
          <span className="inline-flex items-center rounded-full bg-primary-500 px-5 py-2 text-sm font-medium text-white">
            Accent
          </span>
          <span className="inline-flex items-center rounded-full bg-error-500 px-5 py-2 text-sm font-medium text-white">
            Destructive
          </span>
        </motion.div>

        {/* radius demo */}
        <motion.div
          className="mt-10 flex flex-wrap justify-center gap-4"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.4 }}
        >
          {RADII.map((r) => (
            <div
              key={r}
              className={`flex h-14 w-14 items-center justify-center border border-white/10 bg-white/5 text-[10px] text-white/50 shadow-sm rounded-${r}`}
            >
              {r}
            </div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}
