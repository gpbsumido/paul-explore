"use client";

import AuthButton from "@/components/AuthButton";
import SlotMachine from "./SlotMachine";

/** Guest v4 landing: the slot machine with a log-in call to action. */
export default function LandingContentV4() {
  return (
    <SlotMachine
      greeting="Spin through everything I've built, and the write-ups behind it."
      action={
        <AuthButton
          loggedIn={false}
          className="pointer-events-auto inline-flex items-center rounded-full border border-foreground/25 bg-foreground/10 px-5 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-[border-color,background-color] hover:border-foreground/40 hover:bg-foreground/20"
        />
      }
    />
  );
}
