"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion, type Transition } from "framer-motion";
import Section from "./Section";
import {
  cardFlipIn,
  staggerContainer,
  spring,
  instantTransition,
} from "@/lib/animations";

/** Left-to-right clip wipe for the section heading. */
const headingWipe = {
  hidden: { clipPath: "inset(0 100% 0 0)" },
  visible: { clipPath: "inset(0 0% 0 0)" },
};

/** Subtle fade-up for the subtitle. */
const subtitleFade = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

// ---------------------------------------------------------------------------
// Per-feature stroke icons — 24x24 viewBox, strokeWidth 1.5, no fill
// ---------------------------------------------------------------------------

/** Horizontal key with notch */
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-6 w-6",
};

const IconKey = () => (
  <svg {...iconProps}>
    <circle cx="8" cy="14" r="4" />
    <path d="M12 14h8M18 12v4" />
  </svg>
);

/** ECG-style pulse line */
const IconPulse = () => (
  <svg {...iconProps}>
    <polyline points="3,12 7,12 9,4 12,20 14,12 16,16 21,16" />
  </svg>
);

/** Three stacked layers — design token system */
const IconLayers = () => (
  <svg {...iconProps}>
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 12l10 5 10-5" />
    <path d="M2 17l10 5 10-5" />
  </svg>
);

/** Ascending bar chart */
const IconBars = () => (
  <svg {...iconProps}>
    <path d="M4 20V15M9 20V9M14 20V5M19 20V2" />
    <path d="M2 20h20" />
  </svg>
);

/** Two offset card shapes */
const IconCards = () => (
  <svg {...iconProps}>
    <rect x="8" y="3" width="11" height="14" rx="1.5" />
    <rect x="5" y="7" width="11" height="14" rx="1.5" />
  </svg>
);

/** Calendar grid with three dots for event cells */
const IconCalendar = () => (
  <svg {...iconProps}>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <circle cx="8" cy="15" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="15" r="1" fill="currentColor" stroke="none" />
  </svg>
);

/** Three nodes connected by edges — graph */
const IconGraph = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="4" r="2" />
    <circle cx="4" cy="19" r="2" />
    <circle cx="20" cy="19" r="2" />
    <path d="M12 6L5.5 17.5M12 6L18.5 17.5M6 19h12" />
  </svg>
);

/** Scatter of dots with faint connecting lines — particle network */
const IconParticles = () => (
  <svg {...iconProps}>
    <circle cx="5" cy="8" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="4" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="19" cy="9" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="8" cy="17" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="16" cy="19" r="1.5" fill="currentColor" stroke="none" />
    <path d="M5 8l7-4M12 4l7 5M5 8l3 9M19 9l-3 10M8 17l8 2" strokeOpacity="0.5" />
  </svg>
);

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function FeatureCard({
  icon,
  title,
  description,
  transition,
  featureToken,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  transition?: Transition;
  featureToken: string;
}) {
  return (
    <motion.div
      variants={cardFlipIn}
      transition={transition ?? { ...spring.bounce }}
      whileHover={{ y: -4, transition: { ...spring.snappy } }}
      className="group relative overflow-hidden rounded-2xl p-6"
      style={{
        background: `color-mix(in srgb, var(${featureToken}) 6%, rgba(255,255,255,0.04))`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid color-mix(in srgb, var(${featureToken}) 15%, rgba(255,255,255,0.08))`,
      }}
    >
      {/* pastel tint intensifies on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `color-mix(in srgb, var(${featureToken}) 10%, transparent)` }}
      />
      <div className="relative z-10">
        <span className="text-white/70">{icon}</span>
        <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-white/60">{description}</p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export default function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const prefersReduced = useReducedMotion();
  const transition = prefersReduced ? instantTransition : undefined;

  return (
    <Section className="bg-neutral-950 text-neutral-50">
      <div ref={ref}>
        <motion.h2
          className="text-center text-3xl font-bold tracking-tight md:text-4xl"
          variants={headingWipe}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth }}
        >
          What I Built
        </motion.h2>

        <motion.p
          className="mx-auto mt-3 max-w-lg text-center text-neutral-400"
          variants={subtitleFade}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.15 }}
        >
          Authentication, design systems, live data, full-stack API integration,
          and real-user performance monitoring — all in one project.
        </motion.p>

        {/* perspective on the grid gives rotateX a reference plane for cardFlipIn */}
        <motion.div
          className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3"
          style={{ perspective: "1000px" }}
          variants={staggerContainer(0.07, 0.1)}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <FeatureCard
            icon={<IconKey />}
            title="Auth & Security"
            description="Auth0 integration with CSP headers, proxy middleware, and protected routes."
            transition={transition}
            featureToken="--color-feature-auth"
          />
          <FeatureCard
            icon={<IconPulse />}
            title="Web Vitals Dashboard"
            description="Real-user Core Web Vitals collected via sendBeacon, aggregated as P75 in Postgres, and displayed on a protected dashboard."
            transition={transition}
            featureToken="--color-feature-vitals"
          />
          <FeatureCard
            icon={<IconLayers />}
            title="Design System"
            description="Token-driven palette, theme toggling, and reusable components."
            transition={transition}
            featureToken="--color-feature-motion"
          />
          <FeatureCard
            icon={<IconBars />}
            title="NBA Stats"
            description="Live player stats via API proxy with batch loading and error handling."
            transition={transition}
            featureToken="--color-feature-nba"
          />
          <FeatureCard
            icon={<IconCards />}
            title="Pokémon TCG"
            description="Card browser with infinite scroll, URL-synced filters, and per-set grids built on the TCGdex SDK."
            transition={transition}
            featureToken="--color-feature-tcg"
          />
          <FeatureCard
            icon={<IconCalendar />}
            title="Personal Calendar"
            description="Four-view calendar with multi-day events, time-grid overlap layout, and Pokémon card attachments."
            transition={transition}
            featureToken="--color-feature-calendar"
          />
          <FeatureCard
            icon={<IconGraph />}
            title="GraphQL Pokédex"
            description="Pokémon browser using the PokeAPI Hasura endpoint — typed queries, field selection, plain fetch over Apollo."
            transition={transition}
            featureToken="--color-feature-graphql"
          />
          <FeatureCard
            icon={<IconParticles />}
            title="Particle Lab"
            description="Interactive R3F particle network with real-time controls — speed, connection distance, 5 pastel themes, and mouse attraction."
            transition={transition}
            featureToken="--color-feature-particles"
          />
        </motion.div>
      </div>
    </Section>
  );
}
