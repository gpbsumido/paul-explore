"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getReferral, recordReferralClick } from "@/lib/referrals";

const CONFETTI = ["🎉", "✨", "🎊", "⭐️", "💫", "🥳"];

/**
 * The interactive welcome a referral link lands on. It records the click and
 * resolves the link's target (best-effort — a locally-minted demo slug simply
 * won't resolve, which is fine), then invites the visitor in with a little
 * confetti moment.
 */
export default function ReferralLanding({ slug }: { slug: string }) {
  const [target, setTarget] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    // Fire-and-forget: resolve where the link points and count the click.
    // Any failure (unknown slug, offline) just leaves the generic welcome.
    getReferral(slug)
      .then((r) => setTarget(r.targetPath))
      .catch(() => {});
    recordReferralClick(slug).catch(() => {});
  }, [slug]);

  const destination = target ?? "/work-portfolio";

  return (
    <main
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 p-6 text-center text-foreground"
      style={{
        backgroundImage:
          "radial-gradient(52% 40% at 20% 0%, hsl(280 85% 62% / 0.22), transparent 60%), radial-gradient(48% 40% at 84% 12%, hsl(200 85% 60% / 0.18), transparent 62%), radial-gradient(60% 46% at 60% 100%, hsl(150 70% 50% / 0.12), transparent 62%)",
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-surface/70 p-8 shadow-xl backdrop-blur-sm">
        {revealed && (
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {CONFETTI.map((c, i) => (
              <span
                key={i}
                className="absolute text-xl motion-safe:animate-bounce"
                style={{
                  left: `${8 + i * 15}%`,
                  top: `${6 + (i % 3) * 8}%`,
                  animationDelay: `${i * 90}ms`,
                }}
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <p className="text-4xl" aria-hidden>
          👋
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          You followed a shared link
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Someone shared paul-explore with you through the referral link{" "}
          <code className="rounded bg-background/60 px-1.5 py-0.5 font-mono text-[13px] text-foreground">
            /r/{slug}
          </code>
          .
        </p>

        {!revealed ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            🎁 Open your welcome
          </button>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-[14px] font-medium text-foreground">
              Welcome aboard — thanks for stopping by. Have a look around.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href={destination}
                className="inline-flex items-center rounded-full bg-primary-600 px-5 py-2 font-medium text-white transition-colors hover:bg-primary-700"
              >
                {target ? `Continue to ${target}` : "Explore the work"} →
              </Link>
              <Link
                href="/"
                className="inline-flex items-center rounded-full border border-border px-5 py-2 font-medium text-foreground transition-colors hover:bg-surface-raised"
              >
                Home
              </Link>
            </div>
          </div>
        )}
      </div>

      <p className="text-[12px] text-muted">
        Referral links are part of the{" "}
        <Link
          href="/work-portfolio?feature=referral-links"
          className="underline decoration-dotted underline-offset-2 hover:text-foreground"
        >
          UA &amp; Referrals demo
        </Link>
        .
      </p>
    </main>
  );
}
