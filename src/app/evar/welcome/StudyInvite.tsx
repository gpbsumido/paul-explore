"use client";

import { useId } from "react";
import Link from "next/link";
import { JoinForm } from "../ResearchPanel";
import { useStudyStatus } from "@/lib/evar/useStudyStatus";

const button =
  "paul-touch-min inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 text-[14px] text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";
const primary = `${button} border-foreground font-semibold`;

/**
 * The study question, asked on the welcome page rather than in a dialog over
 * the practice. Joining or withdrawing later is the study panel's job, at the
 * bottom of the practice.
 */
export default function StudyInvite() {
  const headingId = useId();
  const study = useStudyStatus();

  const answer = () => {
    if (!study.known) return <p className="mt-4 text-[14px] text-muted">Checking whether you&apos;ve joined…</p>;
    if (study.joined) {
      return (
        <div className="mt-4 flex flex-col items-start gap-4">
          <p className="text-[15px] text-foreground">
            You&apos;re in the study. Every case you finish is kept under your random participant id, and you can
            withdraw at any time from the bottom of the practice page.
          </p>
          <Link href="/evar" className={primary}>
            Start practising
          </Link>
        </div>
      );
    }
    if (study.unreachable) {
      return (
        <div className="mt-4 flex flex-col items-start gap-4">
          <p className="text-[15px] text-foreground">The study isn&apos;t reachable right now. Practice still works.</p>
          <Link href="/evar" className={primary}>
            Start practising
          </Link>
        </div>
      );
    }
    if (study.signedIn) {
      return (
        <div className="mt-4 flex flex-col items-start gap-4">
          <div className="w-full max-w-xl">
            <JoinForm onJoined={study.joinedAs} />
          </div>
          <Link href="/evar" className={button}>
            Not now, just practise
          </Link>
        </div>
      );
    }
    return (
      <div className="mt-4 flex flex-col items-start gap-4">
        <p className="text-[15px] text-muted">
          Joining needs an account, so your attempts can be kept under a random participant id. Practising
          doesn&apos;t.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="/auth/login?returnTo=%2Fevar%2Fwelcome" className={primary}>
            Sign in to join
          </a>
          <Link href="/evar" className={button}>
            Practise without joining
          </Link>
        </div>
      </div>
    );
  };

  return (
    <section aria-labelledby={headingId} className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 id={headingId} className="text-xl font-bold text-foreground">
        Join the study?
      </h2>
      <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-foreground">
        This practice is also a study of how EVAR sizing skill develops over training. Joining is optional, practice
        works exactly the same without it, and you can withdraw at any time.
      </p>
      {answer()}
    </section>
  );
}
