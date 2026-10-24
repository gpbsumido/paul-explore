import type { ReactNode } from "react";
import { WELCOME_GATE_SCRIPT } from "@/lib/evar/welcomeGate";
import WelcomeGate from "./WelcomeGate";

/**
 * The way into the practice: the inline script that sends a first-time full
 * page load to the welcome page before anything paints, then the gate that
 * does the same for a client navigation.
 */
export default function EvarEntry({ children }: { children: ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: WELCOME_GATE_SCRIPT }} />
      <WelcomeGate>{children}</WelcomeGate>
    </>
  );
}
