"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { WELCOME_PATH, hasBeenWelcomed } from "@/lib/evar/welcomeGate";

const noSubscription = () => () => {};
const readWelcomed = () => (typeof window === "undefined" ? true : hasBeenWelcomed(window.localStorage));
// The server can't see the browser's storage, so it renders the practice; a full
// page load that shouldn't see it has already been sent on by the inline script.
const serverWelcomed = () => true;

/**
 * Sends a first-time visitor who arrives by a client navigation on to the
 * welcome page, without drawing the practice first. A full page load is
 * caught earlier, by the script EvarEntry ships.
 */
export default function WelcomeGate({ children }: { children: ReactNode }) {
  const welcomed = useSyncExternalStore(noSubscription, readWelcomed, serverWelcomed);
  const router = useRouter();

  useEffect(() => {
    if (!welcomed) router.replace(WELCOME_PATH);
  }, [welcomed, router]);

  return welcomed ? children : null;
}
