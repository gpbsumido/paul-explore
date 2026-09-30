import type { ReactNode } from "react";
import ZeroProofTracker from "@/components/zeroproof/ZeroProofTracker";

/**
 * Segment layout for `/zeroproof/*`. Mounts the anonymous telemetry tracker
 * once for the whole segment so its queue and session sequence survive client
 * navigations within ZeroProof; renders its children unchanged otherwise.
 */
export default function ZeroProofLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ZeroProofTracker />
      {children}
    </>
  );
}
