"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";
import { DesignSystemChat } from "./sections/DesignSystemChat";
import { DesignSystemSummary1 } from "./sections/DesignSystemSummary1";
import { DesignSystemSummary2 } from "./sections/DesignSystemSummary2";

export default function DesignSystemContent() {
  return (
    <ThoughtLayout
      breadcrumb="Shared Design System"
      title="Shared Design System"
      intro={
        <>
          Extracting tokens and components out of this app into a shared design
          system, then wiring it back in alongside an Angular consumer. Four npm
          packages, one source of truth.
        </>
      }
      chat={<DesignSystemChat />}
    >
      <DesignSystemSummary1 />
      <DesignSystemSummary2 />
      <WhatsNext
        nowShipped={[
          "A published package consumed as a package, rather than shared source imported across projects, so the version boundary is real.",
          "Tokens as the contract between the system and its consumers, which is what lets the theme change without touching components.",
        ]}
        couldImprove={[
          "There is no visual regression testing, so a token change can alter every consumer with nothing catching it.",
          "Adoption is uneven — parts of this app still hand-roll what the system provides, which is how two sources of truth start.",
          "Nothing documents when to use which primitive, only what exists.",
        ]}
        upcoming={[
          "Run axe across the showcase gallery, where every primitive is already rendered in isolation and the check is close to free.",
        ]}
      />
    </ThoughtLayout>
  );
}
