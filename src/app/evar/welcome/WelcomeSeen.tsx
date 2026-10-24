"use client";

import { useEffect } from "react";
import { markWelcomed } from "@/lib/evar/welcomeGate";

/** Remembers that this browser has seen the welcome page, so the practice stops sending it here. */
export default function WelcomeSeen() {
  useEffect(() => {
    markWelcomed(window.localStorage);
  }, []);
  return null;
}
