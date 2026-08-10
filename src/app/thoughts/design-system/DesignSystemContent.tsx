"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
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
    </ThoughtLayout>
  );
}
