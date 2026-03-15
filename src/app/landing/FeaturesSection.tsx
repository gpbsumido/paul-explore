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

function FeatureCard({
  icon,
  title,
  description,
  transition,
}: {
  icon: string;
  title: string;
  description: string;
  transition?: Transition;
}) {
  return (
    <motion.div
      variants={cardFlipIn}
      transition={transition ?? { ...spring.bounce }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6"
    >
      {/* opacity + scale change on hover -- only watch those two properties */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 opacity-0 transition-[opacity,transform] duration-500 group-hover:scale-100 group-hover:opacity-100" />
      <div className="relative z-10">
        <span className="text-3xl">{icon}</span>
        <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-white/60">{description}</p>
      </div>
    </motion.div>
  );
}

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
            icon="🔐"
            title="Auth & Security"
            description="Auth0 integration with CSP headers, proxy middleware, and protected routes."
            transition={transition}
          />
          <FeatureCard
            icon="📊"
            title="Web Vitals Dashboard"
            description="Real-user Core Web Vitals collected via sendBeacon, aggregated as P75 in Postgres, and displayed on a protected dashboard."
            transition={transition}
          />
          <FeatureCard
            icon="🎨"
            title="Design System"
            description="Token-driven palette, theme toggling, and reusable components."
            transition={transition}
          />
          <FeatureCard
            icon="🏀"
            title="NBA Stats"
            description="Live player stats via API proxy with batch loading and error handling."
            transition={transition}
          />
          <FeatureCard
            icon="🃏"
            title="Pokémon TCG"
            description="Card browser with infinite scroll, URL-synced filters, and per-set grids built on the TCGdex SDK."
            transition={transition}
          />
          <FeatureCard
            icon="📅"
            title="Personal Calendar"
            description="Four-view calendar with multi-day events, time-grid overlap layout, and Pokémon card attachments."
            transition={transition}
          />
          <FeatureCard
            icon="◈"
            title="GraphQL Pokédex"
            description="Pokémon browser using the PokeAPI Hasura endpoint — typed queries, field selection, plain fetch over Apollo."
            transition={transition}
          />
        </motion.div>
      </div>
    </Section>
  );
}
