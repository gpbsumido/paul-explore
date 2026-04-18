"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import Section from "./Section";
import {
  spring,
  instantTransition,
  headingWipe,
  fadeUp,
} from "@/lib/animations";

const MOCK_POSTS = [
  {
    user: "paulsum",
    avatar: "#f9a8d4",
    text: "just got back from Tokyo, food was unreal",
    hasImage: true,
    imageGradient: "from-orange-400 to-pink-500",
    likes: 24,
  },
  {
    user: "janedoe",
    avatar: "#a5f3fc",
    text: "finished the redesign, shipping tomorrow",
    hasImage: false,
    imageGradient: "",
    likes: 11,
  },
  {
    user: "markr",
    avatar: "#d9f99d",
    text: "weekend hike was worth it",
    hasImage: true,
    imageGradient: "from-green-400 to-teal-500",
    likes: 38,
  },
];

const HIGHLIGHTS = [
  [
    "Image posts",
    "Upload photos with captions — the feed shows images inline, styled like a social timeline.",
  ],
  [
    "Text posts",
    "Not everything needs a photo. Text-only posts sit cleanly in the same feed.",
  ],
  [
    "Built separately",
    "Its own domain, codebase, and deployment — independent of this playground.",
  ],
] as const;

export default function KetsupSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const prefersReduced = useReducedMotion();
  const transition = prefersReduced ? instantTransition : undefined;

  return (
    <Section glow="radial-gradient(ellipse at 20% 50%, color-mix(in srgb, var(--color-feature-ketsup) 6%, transparent) 0%, transparent 60%)">
      <div ref={ref}>
        <motion.h2
          className="text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl"
          variants={headingWipe}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth }}
        >
          Ketsup
        </motion.h2>

        <motion.p
          className="mx-auto mt-3 max-w-lg text-center text-foreground/70"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.1 }}
        >
          A social app for image and text posts — think Instagram but simpler.
          Live at{" "}
          <a
            href="https://ketsup.paulsumido.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-300 underline underline-offset-2 hover:text-pink-200 transition-colors"
          >
            ketsup.paulsumido.com
          </a>
          .
        </motion.p>

        {/* Mock feed UI */}
        <motion.div
          className="mt-10 overflow-hidden rounded-xl border border-foreground/10 bg-foreground/5 shadow-xl backdrop-blur-sm"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.15 }}
        >
          {/* Mock nav bar */}
          <div className="flex items-center gap-3 border-b border-foreground/10 px-4 py-2.5">
            <div className="h-2 w-2 rounded-full bg-pink-400" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground/80">
              Ketsup
            </span>
            <div className="ml-auto flex gap-1.5">
              <div className="h-5 w-5 rounded-full bg-foreground/15" />
            </div>
          </div>

          {/* Mock post feed */}
          <div className="divide-y divide-foreground/5">
            {MOCK_POSTS.map((post) => (
              <div key={post.user} className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="h-5 w-5 shrink-0 rounded-full"
                    style={{ backgroundColor: post.avatar }}
                  />
                  <span className="text-[11px] font-semibold text-foreground/80">
                    {post.user}
                  </span>
                </div>
                {post.hasImage && (
                  <div
                    className={`mb-2 h-16 w-full rounded-lg bg-gradient-to-br ${post.imageGradient} opacity-80`}
                  />
                )}
                <p className="text-[11px] text-foreground/60">{post.text}</p>
                <div className="mt-1.5 flex items-center gap-1">
                  <div className="h-3 w-3 rounded-sm bg-foreground/10" />
                  <span className="text-[10px] text-foreground/30">
                    {post.likes}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Highlights */}
        <motion.div
          className="mt-8 grid gap-4 md:grid-cols-3"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.35 }}
        >
          {HIGHLIGHTS.map(([t, d]) => (
            <div
              key={t}
              className="rounded-lg border border-foreground/10 bg-foreground/5 p-4 backdrop-blur-sm"
            >
              <h4 className="text-[15px] font-semibold text-foreground">{t}</h4>
              <p className="mt-1 text-[13px] leading-relaxed text-foreground/60">
                {d}
              </p>
            </div>
          ))}
        </motion.div>

        <motion.div
          className="mt-8 flex justify-center"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.5 }}
        >
          <a
            href="https://ketsup.paulsumido.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border dark:border-pink-400/30 border-pink-600/40 bg-pink-500/10 px-6 py-2.5 text-[14px] font-semibold dark:text-pink-300 text-pink-700 transition-colors hover:bg-pink-500/20 dark:hover:text-pink-200 hover:text-pink-800"
          >
            Visit Ketsup →
          </a>
        </motion.div>
      </div>
    </Section>
  );
}
