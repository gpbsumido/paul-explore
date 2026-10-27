"use client";

import { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import PageIntro from "@/components/PageIntro";

/**
 * React page around the Svelte game. The game is a Svelte 5 component, so it
 * can't be rendered as JSX: this shell loads it on the client, mounts it into
 * an empty div that React never writes children into, and unmounts it when the
 * page goes away. Importing inside the effect also keeps the Svelte runtime out
 * of every other route's bundle.
 */
export default function MindReaderContent() {
  const target = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let stop: (() => void) | undefined;

    Promise.all([import("svelte"), import("./MindReader.svelte")]).then(
      ([{ mount, unmount }, { default: MindReader }]) => {
        if (cancelled || !target.current) return;
        const app = mount(MindReader, { target: target.current });
        stop = () => unmount(app);
        setMounted(true);
      },
    );

    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Mind Reader" }]}
        maxWidth="max-w-3xl"
      />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <PageIntro
          eyebrow="Party game"
          title="The Mind Reader"
          lede="One of you holds a secret role. The other has five minutes to work out what it is."
        />
        {mounted ? null : (
          <div
            data-testid="mind-reader-skeleton"
            aria-busy="true"
            className="mx-auto h-64 w-full max-w-xl animate-pulse rounded-xl bg-surface"
          />
        )}
        <div ref={target} />
      </main>
    </PageShell>
  );
}
