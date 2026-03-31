"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import Section from "./Section";
import {
  slideInLeft,
  slideInRight,
  spring,
  instantTransition,
} from "@/lib/animations";

export default function AuthSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const prefersReduced = useReducedMotion();
  const transition = prefersReduced ? instantTransition : undefined;

  // Tween config for SVG stroke drawing — spring doesn't map to pathLength well.
  const drawTransition = prefersReduced
    ? instantTransition
    : { duration: 0.45, ease: "easeInOut" as const };

  return (
    <Section glow="radial-gradient(ellipse at 80% 50%, color-mix(in srgb, var(--color-feature-auth) 5%, transparent) 0%, transparent 60%)">
      <div
        ref={ref}
        className="grid items-center gap-8 md:gap-12 md:grid-cols-2"
      >
        {/* left: text — slides in from the left */}
        <motion.div
          variants={slideInLeft}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth }}
        >
          {/* animated lock icon — stroke draws before text is fully in view */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-4 h-10 w-10 text-primary-400"
            aria-hidden
          >
            {/* shackle arc draws first */}
            <motion.path
              d="M8 11V6.5a4 4 0 0 1 8 0V11"
              stroke="currentColor"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{ ...drawTransition, delay: 0 }}
            />
            {/* body outline draws after shackle */}
            <motion.path
              d="M3 11h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V11z"
              stroke="currentColor"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{
                ...drawTransition,
                delay: prefersReduced ? 0 : 0.35,
              }}
            />
            {/* keyhole dot fades in last */}
            <motion.circle
              cx="12"
              cy="16"
              r="1.5"
              stroke="currentColor"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : { opacity: 0 }}
              transition={
                prefersReduced
                  ? instantTransition
                  : { duration: 0.25, delay: 0.65 }
              }
            />
          </svg>

          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Auth & Security
          </h2>
          <ul className="mt-6 space-y-4 text-white/70">
            {/* Auth0 SDK — horizontal key */}
            <li className="flex items-start gap-3">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 h-4 w-4 shrink-0 text-primary-400"
              >
                <circle cx="5" cy="10" r="3" stroke="currentColor" />
                <path d="M8 10h6M12 8v4" stroke="currentColor" />
              </svg>
              <span>
                <strong className="text-white">Auth0 SDK</strong> — session
                management with server-side token handling
              </span>
            </li>
            {/* CSP Headers — shield */}
            <li className="flex items-start gap-3">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 h-4 w-4 shrink-0 text-primary-400"
              >
                <path
                  d="M8 1.5L2 4.5v4c0 3 2.5 5.5 6 6.5 3.5-1 6-3.5 6-6.5v-4L8 1.5z"
                  stroke="currentColor"
                />
              </svg>
              <span>
                <strong className="text-white">CSP Headers</strong> — strict
                Content-Security-Policy via middleware
              </span>
            </li>
            {/* Proxy Middleware — arrow through a node */}
            <li className="flex items-start gap-3">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 h-4 w-4 shrink-0 text-primary-400"
              >
                <circle cx="8" cy="8" r="2" stroke="currentColor" />
                <path d="M1 8h5M10 8h5M13 6l2 2-2 2" stroke="currentColor" />
              </svg>
              <span>
                <strong className="text-white">Proxy Middleware</strong> — API
                calls proxied server-side to hide secrets
              </span>
            </li>
            {/* Route Protection — forked path with gate */}
            <li className="flex items-start gap-3">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 h-4 w-4 shrink-0 text-primary-400"
              >
                <path d="M4 2v4l4 3 4-3V2" stroke="currentColor" />
                <path d="M8 9v5" stroke="currentColor" />
                <path d="M5 14h6" stroke="currentColor" />
              </svg>
              <span>
                <strong className="text-white">Route Protection</strong> —
                unauthenticated users redirected from private pages
              </span>
            </li>
          </ul>
        </motion.div>

        {/* right: code snippet — slides in from the right with 0.1s delay */}
        <motion.div
          className="min-w-0"
          variants={slideInRight}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          transition={transition ?? { ...spring.smooth, delay: 0.1 }}
        >
          <div className="overflow-x-auto rounded-xl border border-border bg-neutral-950 p-4 font-mono text-xs leading-relaxed text-neutral-300 shadow-lg sm:p-5 sm:text-sm dark:bg-neutral-900">
            <div className="mb-3 flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-error-500/80" />
              <span className="h-3 w-3 rounded-full bg-warning-500/80" />
              <span className="h-3 w-3 rounded-full bg-success-500/80" />
            </div>
            <pre className="overflow-x-auto">
              <code>{`// middleware.ts
export async function middleware(req) {
  const session = await auth0.getSession();

  if (!session && isProtected(req)) {
    return redirect("/auth/login");
  }

  // attach CSP + nonce headers
  return addSecurityHeaders(req);
}`}</code>
            </pre>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
