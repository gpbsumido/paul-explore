"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import AuthButton from "@/components/AuthButton";
import {
  spring,
  instantTransition,
  headingWipe,
  fadeUp,
} from "@/lib/animations";

export default function FooterSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const prefersReduced = useReducedMotion();
  const transition = prefersReduced ? instantTransition : undefined;

  return (
    <section
      className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-32 text-center"
      data-theme="dark"
    >
      <div className="absolute inset-0 pointer-events-none bg-black/52 z-[1]" />

      {/* Soft glow orbs */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary-500/10 blur-3xl z-[2]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-secondary-500/10 blur-3xl z-[2]" />

      <div ref={ref} className="relative z-[3]">
        <motion.h2
          className="text-4xl font-bold tracking-tight text-white md:text-5xl"
          variants={headingWipe}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth }}
        >
          Ready to explore?
        </motion.h2>
        <motion.p
          className="mt-4 text-lg text-white/70"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.1 }}
        >
          Log in and see everything in action.
        </motion.p>
        <motion.div
          className="mt-8"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.2 }}
        >
          <AuthButton
            loggedIn={false}
            className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-8 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/20"
          />
        </motion.div>
      </div>
    </section>
  );
}
