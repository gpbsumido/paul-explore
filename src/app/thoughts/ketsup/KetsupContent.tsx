"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Sent, Received, Timestamp } from "@/lib/threads";
import styles from "@/app/thoughts/styling/styling.module.css";
import ViewToggle from "@/app/thoughts/ViewToggle";

export default function KetsupContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[{ label: "Hub", href: "/" }, { label: "Ketsup" }]}
        right={<ViewToggle view={view} setView={setView} />}
        showLogout={false}
        maxWidth="max-w-3xl"
      />

      {view === "summary" ? (
        <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <header className="mb-10">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted/50">
              Dev notes
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ketsup
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              A social app for image and text posts — think Instagram but
              simpler. Live at{" "}
              <a
                href="https://ketsup.paulsumido.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:opacity-75 transition-opacity"
              >
                ketsup.paulsumido.com
              </a>
              .
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
            <section>
              <h2 className="mb-3 text-lg font-bold">What it is</h2>
              <p className="text-muted">
                Ketsup is a social posting app. You can share image posts with
                captions or drop a quick text post — both land in the same feed.
                The experience is deliberately stripped back compared to
                Instagram: no stories, no reels, no algorithmic noise. Just a
                feed of posts from people you follow.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Posts</h2>
              <ul className="mt-2 space-y-2 text-muted">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    Image posts upload a photo with an optional caption —
                    displayed inline in the feed at full width
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    Text posts are just content, no photo required — sit
                    cleanly in the same feed without feeling second-class
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>
                    Both types support likes and live in the same chronological
                    feed
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Why its own domain</h2>
              <p className="text-muted">
                Ketsup is a real product meant to be used, not just a feature
                demo. Keeping it in paul-explore would have tied it to all the
                decisions in this repo — auth, deployment, bundle constraints —
                which didn&apos;t make sense for something that might have real
                users. Its own domain gives it a clean identity and room to
                evolve independently.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">See it live</h2>
              <div className="mt-4">
                <a
                  href="https://ketsup.paulsumido.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-[14px] font-semibold text-foreground transition-colors hover:bg-surface-raised"
                >
                  ketsup.paulsumido.com →
                </a>
              </div>
            </section>
          </div>
        </main>
      ) : (
        <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <div className={styles.chat}>
            <Timestamp>Earlier</Timestamp>

            <Received pos="first">so what is ketsup</Received>
            <Received pos="last">instagram?</Received>

            <Sent pos="first">kind of yeah, same idea</Sent>
            <Sent pos="middle">you can post images or just text</Sent>
            <Sent pos="last">both show up in the same feed</Sent>

            <Received>what&apos;s the difference from instagram then</Received>

            <Sent pos="first">
              way simpler — no stories, no reels, no algorithm deciding what
              you see
            </Sent>
            <Sent pos="last">just a chronological feed of posts</Sent>

            <Received>makes sense, and it&apos;s live?</Received>

            <Sent pos="first">yeah, ketsup.paulsumido.com</Sent>
            <Sent pos="last">separate domain, own codebase, totally outside this repo</Sent>

            <Received>why not just put it in paul-explore</Received>

            <Sent pos="first">
              it&apos;s meant to be a real product not just a demo
            </Sent>
            <Sent pos="last">
              own domain felt right — cleaner to share, and it can grow without
              being tied to whatever is going on in here
            </Sent>

            <Timestamp>Just now</Timestamp>
          </div>
        </main>
      )}
    </div>
  );
}
