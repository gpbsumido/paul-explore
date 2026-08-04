"use client";

import SlotMachine from "./SlotMachine";
import LandingActions from "./LandingActions";

/** Guest v4 landing: the slot machine with the settings menu and a log-in call to action. */
export default function LandingContentV4() {
  return (
    <SlotMachine
      greeting="Spin through everything I've built, and the write-ups behind it."
      action={<LandingActions loggedIn={false} />}
    />
  );
}
