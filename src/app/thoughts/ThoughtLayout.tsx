"use client";

import { useState, type ReactNode } from "react";
import PageHeader from "@/components/PageHeader";
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
}: Props) {
  const [view, setView] = useState<"summary" | "chat">("summary");
  const hasChat = Boolean(chat);

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: breadcrumb }]}
        right={
          hasChat ? <ViewToggle view={view} setView={setView} /> : undefined
        }
        showLogout={false}
        maxWidth="max-w-3xl"
      />

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
  );
}
