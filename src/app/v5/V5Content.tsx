"use client";

import Link from "next/link";
import ScrollProgress from "@/components/motion/ScrollProgress";
import LandingActions from "@/app/v4/LandingActions";
import Hero from "./sections/Hero";
import Proof from "./sections/Proof";
import CraftSpine from "./sections/CraftSpine";
import FeaturedWork from "./sections/FeaturedWork";
import Writing from "./sections/Writing";
import Archive from "./sections/Archive";
import Contact from "./sections/Contact";
import { SHELL } from "./shell";

/** The signed-in session, as much of it as this page needs. */
export type MeData = { name: string | null; email: string | null };

/** The routes that only mean something once you are signed in. */
const QUICK_LINKS = [
  { label: "Settings", href: "/settings" },
  { label: "Calendar", href: "/calendar" },
  { label: "To-do", href: "/to-do" },
];

/**
 * The v5 landing, both auth states.
 *
 * Guest and signed-in see the same argument in the same order, because the page
 * is aimed at someone deciding whether to interview me and that does not change
 * when I happen to be logged in on my own laptop. The session only adds a strip
 * under the hero: a greeting and the three routes that need an account. Same
 * split the v4 pair uses, one layer lower.
 */
export default function V5Content({ me }: { me?: MeData }) {
  const firstName = me?.name ? me.name.split(" ")[0] : null;

  return (
    <>
      <ScrollProgress height={2} />

      <header className="fixed inset-x-0 top-0 z-[var(--z-sticky)] h-16">
        <div className={`${SHELL} flex h-16 items-center justify-between`}>
          <Link
            href="/"
            className="font-display text-sm font-semibold tracking-tight"
          >
            paul-explore
          </Link>
          <LandingActions loggedIn={Boolean(me)} />
        </div>
      </header>

      <main>
        <Hero />

        {me ? (
          <section
            aria-label="Your account"
            className="border-t border-border bg-surface/50"
          >
            <div
              className={`${SHELL} flex flex-wrap items-center gap-x-6 gap-y-3 py-5`}
            >
              <p className="text-sm text-muted">
                Back again{firstName ? `, ${firstName}` : ""}.
              </p>
              <ul className="flex flex-wrap gap-2">
                {QUICK_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex h-8 items-center rounded-full border border-border bg-surface-raised px-4 text-sm transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <Proof />
        <CraftSpine />
        <FeaturedWork />
        <Writing />
        <Archive />
        <Contact />
      </main>
    </>
  );
}
