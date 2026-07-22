"use client";

import { useState, useEffect, useSyncExternalStore, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// 10 variants — each has a color, message, and animated visual
// ---------------------------------------------------------------------------

type Variant = {
  color: string;
  bg: string;
  heading: string;
  message: string;
  visual: (color: string) => React.ReactNode;
};

const spring = { type: "spring" as const, stiffness: 180, damping: 22 };

// Variant visuals

const SCATTER_OFFSETS = [
  { x: -50, y: -30, rotate: -15 },
  { x: 40, y: 25, rotate: 12 },
  { x: -20, y: -40, rotate: 18 },
];

function ScatteredDigits({ color }: { color: string }) {
  const digits = ["4", "0", "4"].map((d, i) => ({
    d,
    ...SCATTER_OFFSETS[i],
    delay: i * 0.12,
  }));
  return (
    <div className="relative flex h-32 items-center justify-center gap-2">
      {digits.map((digit, i) => (
        <motion.span
          key={i}
          className="font-mono text-6xl font-bold"
          style={{ color }}
          initial={{ opacity: 0, x: digit.x, y: digit.y, rotate: digit.rotate }}
          animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
          transition={{ ...spring, delay: digit.delay }}
        >
          {digit.d}
        </motion.span>
      ))}
    </div>
  );
}

function PulsingRings({ color }: { color: string }) {
  return (
    <div className="relative flex h-32 items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{ borderColor: color }}
          initial={{ width: 20, height: 20, opacity: 0.8 }}
          animate={{
            width: [20, 100 + i * 30],
            height: [20, 100 + i * 30],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeOut",
          }}
        />
      ))}
      <span className="relative font-mono text-3xl font-bold" style={{ color }}>
        404
      </span>
    </div>
  );
}

function BouncingDot({ color }: { color: string }) {
  return (
    <div className="flex h-32 items-end justify-center gap-6 pb-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-5 w-5 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ y: [0, -50, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function GlitchText({ color }: { color: string }) {
  return (
    <div className="relative flex h-32 items-center justify-center">
      <motion.span
        className="absolute font-mono text-6xl font-bold"
        style={{ color, opacity: 0.3 }}
        animate={{ x: [-2, 2, -1, 0], y: [1, -1, 0] }}
        transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2 }}
      >
        404
      </motion.span>
      <motion.span
        className="absolute font-mono text-6xl font-bold"
        style={{ color, opacity: 0.3, filter: "blur(1px)" }}
        animate={{ x: [2, -2, 1, 0], y: [-1, 1, 0] }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
          repeatDelay: 2,
          delay: 0.05,
        }}
      >
        404
      </motion.span>
      <span className="relative font-mono text-6xl font-bold" style={{ color }}>
        404
      </span>
    </div>
  );
}

function OrbitingDots({ color }: { color: string }) {
  return (
    <div className="relative flex h-32 items-center justify-center">
      <span className="font-mono text-4xl font-bold" style={{ color }}>
        404
      </span>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="absolute h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color, opacity: 0.6 - i * 0.08 }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div
            className="absolute h-2.5 w-2.5 rounded-full"
            style={{
              backgroundColor: color,
              top: -(40 + i * 8),
              left: "50%",
              transform: "translateX(-50%)",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

function StackedCards({ color }: { color: string }) {
  return (
    <div className="relative flex h-32 items-center justify-center">
      {[2, 1, 0].map((i) => (
        <motion.div
          key={i}
          className="absolute flex h-20 w-36 items-center justify-center rounded-lg border font-mono text-2xl font-bold"
          style={{
            borderColor: color,
            color,
            backgroundColor: `color-mix(in srgb, ${color} ${8 + i * 4}%, transparent)`,
          }}
          initial={{ y: 40, opacity: 0, rotate: (i - 1) * 8 }}
          animate={{ y: i * -4, opacity: 1 - i * 0.2, rotate: (i - 1) * 6 }}
          transition={{ ...spring, delay: (2 - i) * 0.1 }}
        >
          {i === 0 ? "404" : ""}
        </motion.div>
      ))}
    </div>
  );
}

function TypewriterText({ color }: { color: string }) {
  const [charCount, setCharCount] = useState(0);
  const text = "404 Not Found_";

  useEffect(() => {
    if (charCount < text.length) {
      const timeout = setTimeout(
        () => setCharCount((c) => c + 1),
        90 + (charCount % 3) * 20,
      );
      return () => clearTimeout(timeout);
    }
  }, [charCount, text.length]);

  return (
    <div className="flex h-32 items-center justify-center">
      <span className="font-mono text-3xl font-bold" style={{ color }}>
        {text.slice(0, charCount)}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          className="ml-0.5 inline-block w-3 border-b-2"
          style={{ borderColor: color }}
        />
      </span>
    </div>
  );
}

function WavyDigits({ color }: { color: string }) {
  const chars = "404".split("");
  return (
    <div className="flex h-32 items-center justify-center gap-1">
      {chars.map((char, i) => (
        <motion.span
          key={i}
          className="font-mono text-6xl font-bold"
          style={{ color }}
          animate={{ y: [0, -16, 0] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        >
          {char}
        </motion.span>
      ))}
    </div>
  );
}

function SpinningSquare({ color }: { color: string }) {
  return (
    <div className="relative flex h-32 items-center justify-center">
      <motion.div
        className="absolute h-20 w-20 rounded-md border-2"
        style={{ borderColor: color }}
        animate={{ rotate: 360, scale: [1, 0.8, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute h-12 w-12 rounded-md border-2"
        style={{ borderColor: color, opacity: 0.5 }}
        animate={{ rotate: -360, scale: [0.8, 1, 0.8] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      <span className="relative font-mono text-2xl font-bold" style={{ color }}>
        404
      </span>
    </div>
  );
}

const PARTICLE_SIZES = [5, 3, 6, 4, 7, 3, 5, 4, 6, 3, 5, 4];

function ParticlesBurst({ color }: { color: string }) {
  const particles = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    return {
      x: Math.cos(angle) * 60,
      y: Math.sin(angle) * 60,
      size: PARTICLE_SIZES[i],
    };
  });
  return (
    <div className="relative flex h-32 items-center justify-center">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ backgroundColor: color, width: p.size, height: p.size }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            x: [0, p.x, p.x * 0.6],
            y: [0, p.y, p.y * 0.6],
            opacity: [0, 0.8, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.06,
            ease: "easeOut",
          }}
        />
      ))}
      <motion.span
        className="relative font-mono text-4xl font-bold"
        style={{ color }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={spring}
      >
        404
      </motion.span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant definitions
// ---------------------------------------------------------------------------

const VARIANTS: Variant[] = [
  {
    color: "#f472b6",
    bg: "rgba(244,114,182,0.04)",
    heading: "Drifted off course",
    message: "This page floated away. Or maybe it was never here.",
    visual: (c) => <ScatteredDigits color={c} />,
  },
  {
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.04)",
    heading: "Signal lost",
    message: "We sent out a ping but nothing came back.",
    visual: (c) => <PulsingRings color={c} />,
  },
  {
    color: "#34d399",
    bg: "rgba(52,211,153,0.04)",
    heading: "Still loading... just kidding",
    message: "This page doesn't exist. The dots are just vibes.",
    visual: (c) => <BouncingDot color={c} />,
  },
  {
    color: "#fb923c",
    bg: "rgba(251,146,60,0.04)",
    heading: "Corrupted coordinates",
    message: "The address glitched. Try a different route.",
    visual: (c) => <GlitchText color={c} />,
  },
  {
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.04)",
    heading: "Lost in orbit",
    message: "This page is somewhere in the void. You are not.",
    visual: (c) => <OrbitingDots color={c} />,
  },
  {
    color: "#f87171",
    bg: "rgba(248,113,113,0.04)",
    heading: "Deck's empty",
    message: "We shuffled through everything. This card wasn't in the pile.",
    visual: (c) => <StackedCards color={c} />,
  },
  {
    color: "#4ade80",
    bg: "rgba(74,222,128,0.04)",
    heading: "End of the line",
    message: "The cursor reached the end and found nothing to print.",
    visual: (c) => <TypewriterText color={c} />,
  },
  {
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.04)",
    heading: "Riding the wave to nowhere",
    message: "This URL crested and broke. Paddle back to shore.",
    visual: (c) => <WavyDigits color={c} />,
  },
  {
    color: "#facc15",
    bg: "rgba(250,204,21,0.04)",
    heading: "Caught in a loop",
    message: "We looked everywhere. This page keeps not existing.",
    visual: (c) => <SpinningSquare color={c} />,
  },
  {
    color: "#e879f9",
    bg: "rgba(232,121,249,0.04)",
    heading: "Gone supernova",
    message: "This page exploded into particles. Beautiful, but unhelpful.",
    visual: (c) => <ParticlesBurst color={c} />,
  },
];

// ---------------------------------------------------------------------------
// Not Found page
// ---------------------------------------------------------------------------

const emptySubscribe = () => () => {};

function useClientOnly() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export default function NotFound() {
  const mounted = useClientOnly();
  const router = useRouter();
  const [variantIndex] = useState(() =>
    Math.floor(Math.random() * VARIANTS.length),
  );

  const goBack = useCallback(() => router.back(), [router]);

  const variant = VARIANTS[variantIndex];

  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-background px-4"
      style={mounted ? { backgroundColor: variant.bg } : undefined}
    >
      {mounted && (
        <div className="max-w-sm text-center">
          <AnimatePresence>
            <motion.div
              key={variantIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {variant.visual(variant.color)}

              <motion.h1
                className="mt-4 text-2xl font-bold tracking-tight text-foreground"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.2 }}
              >
                {variant.heading}
              </motion.h1>

              <motion.p
                className="mt-2 text-[14px] leading-relaxed text-muted"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.3 }}
              >
                {variant.message}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.4 }}
                className="mt-6 flex items-center justify-center gap-4"
              >
                <button type="button"
                  onClick={goBack}
                  className="font-mono text-[13px] transition-colors hover:brightness-110"
                  style={{ color: variant.color }}
                >
                  ← Go back
                </button>
                <span className="text-muted">|</span>
                <Link
                  href="/"
                  className="font-mono text-[13px] transition-colors hover:brightness-110"
                  style={{ color: variant.color }}
                >
                  Home
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
