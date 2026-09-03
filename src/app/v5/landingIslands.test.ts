import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

/**
 * The landing is a server tree with client islands, not one big client
 * component. The whole point is that the section markup and the static data it
 * imports never ship to the browser; only the genuinely-interactive leaves
 * hydrate. This test pins that boundary structurally, because it is the kind of
 * thing a stray "use client" silently undoes.
 */
const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");
const isClient = (rel: string) => /^["']use client["']/m.test(read(rel).trimStart());

const SERVER = [
  "src/app/v5/LandingContentV5.tsx",
  "src/app/v5/V5Content.tsx",
  "src/app/v5/sections/Hero.tsx",
  "src/app/v5/sections/Proof.tsx",
  "src/app/v5/sections/Writing.tsx",
  "src/app/v5/sections/Archive.tsx",
  "src/app/v5/sections/Contact.tsx",
  "src/app/v5/sections/CraftSpine.tsx",
  "src/app/v5/sections/FeaturedWork.tsx",
];

// The islands: interactivity (session, scroll) and the motion leaves. These
// stay client on purpose — they are the periphery the boundary is pushed down to.
const CLIENT = [
  "src/app/v4/LandingActions.tsx",
  "src/components/motion/ScrollProgress.tsx",
  "src/components/motion/RevealOnScroll.tsx",
  "src/components/motion/TextReveal.tsx",
  "src/components/motion/BlobBackground.tsx",
  "src/components/motion/MagneticButton.tsx",
];

describe("landing client boundary", () => {
  it.each(SERVER)("keeps %s a server component (no 'use client')", (file) => {
    expect(isClient(file)).toBe(false);
  });

  it.each(CLIENT)("keeps %s a client island", (file) => {
    expect(isClient(file)).toBe(true);
  });
});

describe("landing data tree", () => {
  it("imports the heavy static content data only into server sections", () => {
    // FEATURES/THOUGHTS/CRAFT_TRAITS are large static modules. If the section
    // importing them is a client component, the whole module ships to the
    // browser. Assert the importers are server components, so the data stays
    // server-side.
    for (const file of [
      "src/app/v5/sections/FeaturedWork.tsx",
      "src/app/v5/sections/Writing.tsx",
      "src/app/v5/sections/CraftSpine.tsx",
    ]) {
      expect(isClient(file)).toBe(false);
    }
  });
});
