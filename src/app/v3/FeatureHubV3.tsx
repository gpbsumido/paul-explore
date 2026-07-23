"use client";

import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import GraphShell from "./GraphShell";

type MeData = { name: string | null; email: string | null };

/** Signed-in v3 hub: the same node graph, with a greeting and account controls. */
export default function FeatureHubV3({ initialMe }: { initialMe?: MeData }) {
  const firstName = initialMe?.name ? initialMe.name.split(" ")[0] : "there";

  return (
    <GraphShell
      greeting={`Hey ${firstName} — everything you've got, mapped by how it connects. Drag to explore.`}
      action={
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="inline-flex items-center rounded-full border border-border bg-surface/70 px-4 py-2 text-sm font-medium text-muted backdrop-blur-sm transition-colors hover:text-foreground"
          >
            Settings
          </Link>
          <AuthButton
            loggedIn
            className="inline-flex items-center rounded-full border border-foreground/25 bg-foreground/10 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-[border-color,background-color] hover:border-foreground/40 hover:bg-foreground/20"
          />
        </div>
      }
    />
  );
}
