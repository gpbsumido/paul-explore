"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { THOUGHTS } from "@/app/_shared/featureData";

/** Index for the /thoughts section: a card grid linking to every dev-notes write-up. */
export default function ThoughtsIndexContent() {
  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Hub", href: "/" },
          { label: "Thoughts" },
        ]}
        showLogout={false}
        maxWidth="max-w-5xl"
      />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <header className="mb-10">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
            Dev notes
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Thoughts
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Deep-dives into the architecture decisions, trade-offs, and lessons
            behind everything in this project.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {THOUGHTS.map((thought) => (
            <Link
              key={thought.href}
              href={thought.href}
              className="flex h-full items-start gap-3 rounded-xl border border-border p-4 transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm"
              style={{ borderLeftWidth: 3, borderLeftColor: thought.color }}
            >
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{thought.title}</p>
                <p className="mt-1 text-sm text-muted">{thought.preview}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
