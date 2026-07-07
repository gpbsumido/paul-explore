"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  fadeInUp,
  staggerContainer,
  spring,
  instantTransition,
} from "@/lib/animations";
import { THOUGHTS } from "@/app/_shared/featureData";

export default function ThoughtsPreview() {
  const prefersReduced = useReducedMotion();
  const skip = prefersReduced ?? false;

  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      {/* Heading */}
      <motion.div
        className="mb-12 text-center"
        initial={skip ? false : { opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={skip ? instantTransition : spring.smooth}
      >
        <h2 className="text-3xl font-bold text-foreground">
          How it&apos;s built
        </h2>
        <p className="mt-3 text-muted">
          Deep-dives into architecture decisions, trade-offs, and lessons
          learned
        </p>
      </motion.div>

      {/* Card grid */}
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={staggerContainer(0.05)}
        initial={skip ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, margin: "-10%" }}
      >
        {THOUGHTS.map((thought) => (
          <motion.div
            key={thought.href}
            variants={fadeInUp}
            transition={skip ? instantTransition : spring.smooth}
          >
            <Link
              href={thought.href}
              className="flex h-full items-start gap-3 rounded-xl border border-border p-4 transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm"
              style={{ borderLeftWidth: 3, borderLeftColor: thought.color }}
            >
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{thought.title}</p>
                <p className="mt-1 text-sm text-muted">{thought.preview}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
