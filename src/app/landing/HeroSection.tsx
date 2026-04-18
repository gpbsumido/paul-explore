"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import AuthButton from "@/components/AuthButton";
import HeaderMenu from "@/components/HeaderMenu";
import {
  wordReveal,
  staggerContainer,
  scaleIn,
  spring,
  instantTransition,
} from "@/lib/animations";

const HeroGlobeCanvas = dynamic(() => import("./models/HeroGlobeCanvas"), {
  ssr: false,
});

const WORDS = "Paul Sumido Portfolio".split(" ");

export default function HeroSection() {
  // mounted gates the entrance animation so the H1 is visible in SSR HTML
  // (initial={false} server-side preserves LCP) and only animates on the client.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const prefersReduced = useReducedMotion();
  const transition = prefersReduced ? instantTransition : undefined;

  return (
    <>
      <div className="fixed right-4 top-4 z-50">
        <HeaderMenu showLogout={false} showLogin showWeatherToggle />
      </div>

      <section
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center"
        data-theme="dark"
      >
        {/* Wireframe icosahedron — ambient depth layer, bleeds off all edges */}
        <HeroGlobeCanvas />

        {/* Radial vignette darkens the edges, centres readable text */}
        <div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 50%, transparent 0%, rgba(0,4,12,0.60) 100%)",
          }}
        />

        {/* Word-by-word H1 spring assembly. Server renders all words visible
            (initial={false}) so the H1 is in the LCP paint. On mount the
            client replays the entrance from hidden. */}
        <motion.h1
          className="relative z-10 text-5xl font-bold tracking-tight text-white md:text-7xl"
          style={{
            perspective: 800,
            textShadow:
              "0 0 40px rgba(92,206,245,0.5), 0 0 80px rgba(92,206,245,0.2), 0 2px 6px rgba(0,0,0,0.8)",
          }}
          variants={staggerContainer(0.08, 0.1)}
          initial={mounted ? "hidden" : false}
          animate="visible"
        >
          {WORDS.map((word, i) => (
            <motion.span
              key={i}
              variants={wordReveal}
              transition={transition ?? { ...spring.wordReveal }}
              style={{ display: "inline-block", marginRight: "0.3em" }}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subtitle fades up after the title stagger finishes */}
        <motion.p
          className="relative z-10 mt-4 max-w-md text-lg md:text-xl"
          style={{
            color: "rgba(180,235,255,0.75)",
            textShadow: "0 1px 8px rgba(0,0,0,0.6)",
          }}
          initial={mounted ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={transition ?? { ...spring.smooth, delay: 0.5 }}
        >
          A playground where I can test different styles and functionality.
        </motion.p>

        {/* CTA scales in from 0.85 with bounce spring */}
        <motion.div
          className="relative z-10 mt-8"
          variants={scaleIn}
          initial={mounted ? "hidden" : false}
          animate="visible"
          transition={transition ?? { ...spring.bounce, delay: 0.65 }}
          style={{ originX: 0.5, originY: 0.5 }}
        >
          <AuthButton
            loggedIn={false}
            className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-8 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/20"
          />
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
          initial={mounted ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={transition ?? { delay: 1.2, duration: 0.8 }}
          aria-hidden
        >
          <div
            className="flex flex-col items-center gap-1"
            style={{ color: "rgba(130,210,240,0.45)" }}
          >
            <span
              className="text-xs uppercase"
              style={{ letterSpacing: "0.2em" }}
            >
              scroll
            </span>
            <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
              <rect
                x="1"
                y="1"
                width="12"
                height="18"
                rx="6"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <motion.rect
                x="6"
                y="4"
                width="2"
                height="4"
                rx="1"
                fill="currentColor"
                animate={{ y: [4, 8, 4] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </svg>
          </div>
        </motion.div>
      </section>
    </>
  );
}
