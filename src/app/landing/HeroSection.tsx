"use client";

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
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

// ShaderGradient needs a canvas + window — must stay client-only.
// The black div fallback paints immediately so LCP fires on the H1
// before WebGL finishes loading, not after.
const ShaderGradientScene = dynamic(() => import("./ShaderGradientScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-black pointer-events-none" />
  ),
});

const WORDS = "Paul Sumido Portfolio".split(" ");

export default function HeroSection() {
  // mounted gates the entrance animation so the H1 is visible in SSR HTML
  // (initial={false} server-side preserves LCP) and only animates on the client.
  // useSyncExternalStore gives false on the server and true on the client
  // without needing an effect-based setState.
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const prefersReduced = useReducedMotion();

  // Camera angles for mouse-driven parallax on the shader gradient.
  // Refs hold the live target; state is updated via RAF so React batches repaints.
  const azimuthRef = useRef(225);
  const polarRef = useRef(100);
  const rafRef = useRef<number | null>(null);
  const [cameraAngles, setCameraAngles] = useState({ azimuth: 225, polar: 100 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - left) / width;   // 0..1 left→right
    const ny = (e.clientY - top) / height;   // 0..1 top→bottom
    // Map mouse position to camera angle ranges
    azimuthRef.current = 180 + nx * 90;      // 180..270
    polarRef.current   = 85  + ny * 40;      // 85..125

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        setCameraAngles({ azimuth: azimuthRef.current, polar: polarRef.current });
        rafRef.current = null;
      });
    }
  }, []);

  useEffect(() => {
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, []);

  const transition = prefersReduced ? instantTransition : undefined;

  return (
    <>
      <div className="fixed right-4 top-4 z-50">
        <HeaderMenu showLogout={false} showLogin />
      </div>

      <section
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center"
        onMouseMove={handleMouseMove}
      >
        <ShaderGradientScene cAzimuthAngle={cameraAngles.azimuth} cPolarAngle={cameraAngles.polar} />
        {/* Scrim: white wash in light mode for text legibility, dark scrim in dark mode */}
        <div className="absolute inset-0 bg-background/75 dark:bg-black/50 pointer-events-none z-[1]" />

        {/* Word-by-word H1 spring assembly. Server renders all words visible
            (initial={false}) so the H1 is in the LCP paint. On mount the
            client replays the entrance from hidden. */}
        <motion.h1
          className="relative z-10 text-5xl font-bold tracking-tight text-foreground md:text-7xl"
          style={{ perspective: 800 }}
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
          className="relative z-10 mt-4 max-w-md text-lg text-muted md:text-xl"
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
            className="inline-flex items-center rounded-full bg-foreground px-8 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity"
          />
        </motion.div>
      </section>
    </>
  );
}
