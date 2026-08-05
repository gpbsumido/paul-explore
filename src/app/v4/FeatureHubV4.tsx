"use client";

import SlotMachine from "./SlotMachine";
import LandingActions from "./LandingActions";

type MeData = { name: string | null; email: string | null };

/** Signed-in v4 hub: the same slot machine, with a greeting and account controls. */
export default function FeatureHubV4({ initialMe }: { initialMe?: MeData }) {
  const firstName = initialMe?.name ? initialMe.name.split(" ")[0] : "there";

  return (
    <SlotMachine
      greeting={`Hey ${firstName} — spin through everything you've got.`}
      action={<LandingActions loggedIn />}
    />
  );
}
