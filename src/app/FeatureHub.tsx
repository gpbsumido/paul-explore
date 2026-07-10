"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { reveal } from "@/app/landing/Section";
import { queryKeys } from "@/lib/queryKeys";
import { staggerContainer } from "@/lib/animations";
import { useHubReducedMotion } from "@/app/providers";
import {
  FEATURES,
  THOUGHTS,
  FeatureCard,
  ThoughtCard,
} from "@/app/_shared/featureData";

// ---- FeatureHub ----

type MeData = { name: string | null; email: string | null };

/**
 * The authenticated hub. Shows a sticky header with user info, a staggered grid
 * of feature cards each with a themed mini-preview, and a dev-notes section below.
 *
 * Feature cards animate in via Framer staggerContainer + cardFlipIn variants.
 * initialMe is seeded from the Auth0 session in page.tsx so the user name renders
 * on first paint without a client-side /api/me fetch — the query still runs in the
 * background and refreshes after 5 minutes.
 */
export default function FeatureHub({ initialMe }: { initialMe?: MeData }) {
  const prefersReduced = useHubReducedMotion();

  const meQuery = useQuery({
    queryKey: queryKeys.me(),
    queryFn: (): Promise<MeData> => fetch("/api/me").then((r) => r.json()),
    initialData: initialMe,
    staleTime: 5 * 60_000,
  });
  const userName = meQuery.isLoading ? null : (meQuery.data?.name ?? "there");
  const userEmail = meQuery.data?.email ?? undefined;

  const thoughtsRef = useRef(null);
  const thoughtsVisible = useInView(thoughtsRef, {
    once: true,
    margin: "-10% 0px",
  });

  const firstName = userName ? userName.split(" ")[0] : null;

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        as="header"
        zIndex="z-30"
        left={
          <span className="text-base font-bold tracking-tight text-foreground">
            paul-explore
          </span>
        }
        right={
          /* User info — hidden on small screens where space is tight */
          <div className="hidden flex-col items-end sm:flex">
            {userName === null ? (
              <>
                <div className="h-[11px] w-[88px] rounded bg-surface animate-pulse" />
                <div className="mt-0.5 h-[10px] w-[120px] rounded bg-surface animate-pulse" />
              </>
            ) : (
              <>
                <span className="text-[12px] font-medium leading-none text-foreground">
                  {userName}
                </span>
                <span className="mt-0.5 text-[11px] leading-none text-muted">
                  {userEmail ?? "no email on file"}
                </span>
              </>
            )}
          </div>
        }
        showSettings
        overlay={
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(139,92,246,0.04), transparent)",
            }}
          />
        }
      />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Hey {firstName ?? "there"}, here&apos;s what&apos;s live.
          </h1>
          <p className="mt-1.5 text-[14px] text-muted">
            {FEATURES.length} features — click any card to jump in, or hit About
            to read how it was built.
          </p>
        </div>

        {/* Feature grid — cards stagger in with cardFlipIn via Framer variants */}
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          style={{ perspective: "1000px" }}
          variants={staggerContainer(0.07)}
          initial="hidden"
          animate="visible"
        >
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              prefersReduced={prefersReduced}
            />
          ))}
        </motion.div>

        {/* Dev notes — scroll-triggered */}
        <div ref={thoughtsRef} className="mt-14">
          <h2
            className={[
              "mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted",
              reveal(thoughtsVisible, ""),
            ].join(" ")}
          >
            Dev notes
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {THOUGHTS.map((thought, i) => (
              <ThoughtCard
                key={thought.href}
                thought={thought}
                delayMs={i * 75}
                visible={thoughtsVisible}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
