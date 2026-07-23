"use client";

import AuthButton from "@/components/AuthButton";
import GraphShell from "./GraphShell";

/** Guest v3 landing: the node graph with a log-in call to action. */
export default function LandingContentV3() {
  return (
    <GraphShell
      greeting="Every feature and write-up, wired by how they connect. Drag to explore."
      action={
        <AuthButton
          loggedIn={false}
          className="pointer-events-auto inline-flex items-center rounded-full border border-foreground/25 bg-foreground/10 px-5 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-[border-color,background-color] hover:border-foreground/40 hover:bg-foreground/20"
        />
      }
    />
  );
}
