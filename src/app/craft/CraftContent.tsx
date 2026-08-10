"use client";

import { useState } from "react";
import Link from "next/link";
import { m, useReducedMotion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { CRAFT_TRAITS, type CraftTrait } from "@/lib/craft";

/** Chevron that rotates when its card is open. */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden
      className={`shrink-0 text-muted transition-transform duration-150 ${
        open ? "rotate-180" : ""
      }`}
    >
      <path
        d="M2 3.5L5 6.5L8 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * One trait: a header button that expands to reveal what a lead does here and
 * the evidence chips proving it. The button owns aria-expanded and points at
 * the panel it controls, so the whole thing is operable from the keyboard with
 * a visible focus ring. Motion is gated on prefers-reduced-motion.
 */
function TraitCard({
  trait,
  open,
  onToggle,
  reduced,
}: {
  trait: CraftTrait;
  open: boolean;
  onToggle: () => void;
  reduced: boolean;
}) {
  const panelId = `craft-panel-${trait.id}`;
  const headingId = `craft-heading-${trait.id}`;

  return (
    <div
      className="glass-card overflow-hidden rounded-xl"
      style={{ borderLeftWidth: 3, borderLeftColor: trait.color }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
      >
        <span
          aria-hidden
          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: trait.color }}
        />
        <span className="min-w-0 flex-1">
          <span
            id={headingId}
            className="block font-semibold leading-snug text-foreground"
          >
            {trait.title}
          </span>
          <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">
            {trait.principle}
          </span>
        </span>
        <Chevron open={open} />
      </button>

      {open && (
        <m.div
          id={panelId}
          role="region"
          aria-labelledby={headingId}
          initial={reduced ? false : { opacity: 0, height: 0 }}
          animate={reduced ? undefined : { opacity: 1, height: "auto" }}
          className="px-4 pb-4"
        >
          <p className="text-[14px] leading-relaxed text-foreground/80">
            {trait.detail}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {trait.evidence.map((ev) => (
              <li key={ev.href}>
                <Link
                  href={ev.href}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[12px] sm:min-h-0 text-muted transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
                >
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: trait.color }}
                  />
                  {ev.label}
                </Link>
              </li>
            ))}
          </ul>
        </m.div>
      )}
    </div>
  );
}

/**
 * The /craft page: an interactive matrix of the traits a lead front-end
 * developer is measured on. Each trait expands to the proof already shipped in
 * this project, so the page argues from things you can open rather than a list
 * of adjectives. All cards start expanded so nothing is hidden behind a click,
 * and "Collapse all"/"Expand all" toggles the whole set at once.
 */
export default function CraftContent() {
  const prefersReduced = useReducedMotion();
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(CRAFT_TRAITS.map((t) => t.id)),
  );

  const allOpen = openIds.size === CRAFT_TRAITS.length;

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setOpenIds(allOpen ? new Set() : new Set(CRAFT_TRAITS.map((t) => t.id)));

  return (
    <PageShell colorA="#c084fc" colorB="#38bdf8">
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: "Craft" }]}
        maxWidth="max-w-3xl"
      />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <header className="mb-8">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
            The craft
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            What a lead front-end developer does
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            {CRAFT_TRAITS.length} traits, each one backed by something already
            shipped in this project. Open a trait to see what owning it means
            and where it shows up. This whole site is the portfolio; this page
            is the index into it.
          </p>
        </header>

        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={toggleAll}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>

        <div className="space-y-3">
          {CRAFT_TRAITS.map((trait) => (
            <TraitCard
              key={trait.id}
              trait={trait}
              open={openIds.has(trait.id)}
              onToggle={() => toggle(trait.id)}
              reduced={!!prefersReduced}
            />
          ))}
        </div>
      </main>
    </PageShell>
  );
}
