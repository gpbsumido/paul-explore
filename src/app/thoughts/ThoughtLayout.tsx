"use client";

import { useState, type ReactNode } from "react";
import PageHeader from "@/components/PageHeader";
import AmbientBackground from "@/components/AmbientBackground";
import ViewToggle from "@/app/thoughts/ViewToggle";

type Props = {
  /** Breadcrumb label (the page title in the header trail). */
  breadcrumb: string;
  /** The big page heading in the summary view. */
  title: string;
  /** The lead paragraph under the heading. */
  intro: ReactNode;
  /**
   * Optional iMessage-style "chat" view. When provided, the header shows the
   * summary/chat toggle and this renders in the chat view; when omitted, the
   * page is summary-only with no toggle.
   */
  chat?: ReactNode;
  /** The summary sections (each an <section>). */
  children: ReactNode;
  /** Marks the write-up as documenting a feature that's no longer in the app. */
  deprecated?: boolean;
};

/**
 * The shared scaffold every dev-notes write-up repeated by hand: the page
 * shell, the breadcrumb header (with the optional summary/chat toggle), and the
 * "Dev notes" eyebrow + heading + intro of the summary view. Pages supply only
 * their content — the layout, and cross-cutting fixes to it, live here once.
 */
export default function ThoughtLayout({
  breadcrumb,
  title,
  intro,
  chat,
  children,
  deprecated = false,
}: Props) {
  const [view, setView] = useState<"summary" | "chat">("summary");
  const hasChat = Boolean(chat);

  return (
    <div className="relative min-h-dvh bg-background">
      <AmbientBackground colorA="#818cf8" colorB="#38bdf8" />
      <div className="relative z-10">
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: breadcrumb }]}
        right={
          hasChat ? <ViewToggle view={view} setView={setView} /> : undefined
        }
        showLogout={false}
        maxWidth="max-w-3xl"
      />

      {deprecated ? (
        <div className="mx-auto max-w-3xl px-4 pt-6">
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-[13px] text-amber-600 dark:text-amber-400">
            <span className="font-semibold">Deprecated.</span> This write-up
            documents a feature that&apos;s no longer part of the app. It&apos;s
            kept here for the history and the reasoning.
          </p>
        </div>
      ) : null}

      {!hasChat || view === "summary" ? (
        <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <header className="mb-10">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
              Dev notes
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{intro}</p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
            {children}
          </div>
        </main>
      ) : (
        chat
      )}
      </div>
    </div>
  );
}
