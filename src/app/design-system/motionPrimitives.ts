/**
 * The app's own motion primitives, documented for the showcase page.
 *
 * These deliberately do NOT live in `COMPONENTS`. catalog.test.ts asserts exact
 * set equality between every documented `importName` and the exports of
 * @paul-portfolio/react, so an app-local component fails it twice over: once as
 * a documented name with no export behind it, and once by pushing the two lists
 * out of step. They are app components, not design-system components, and this
 * list keeps that distinction honest instead of loosening the integrity check.
 */

/** One documented motion primitive from `src/components/motion/`. */
export type MotionPrimitiveDoc = {
  /** Stable kebab id used for anchors. */
  id: string;
  /** Component name, matching the file and the default export. */
  name: string;
  /** Where it is imported from. */
  importPath: string;
  /** One-line summary shown under the name. */
  tagline: string;
  /** What it does when the user has asked for reduced motion. */
  reducedMotion: string;
  /** The page these ship on. The v5 landing composes all eight. */
  usedOn: string;
};

const USED_ON = "/";

export const MOTION_PRIMITIVES: MotionPrimitiveDoc[] = [
  {
    id: "text-reveal",
    name: "TextReveal",
    importPath: "@/components/motion/TextReveal",
    tagline:
      "A headline that rises into place a word at a time once it scrolls into view.",
    reducedMotion: "Renders the finished headline, nothing moves.",
    usedOn: USED_ON,
  },
  {
    id: "text-scramble",
    name: "TextScramble",
    importPath: "@/components/motion/TextScramble",
    tagline: "Text that decodes itself left to right through a glyph churn.",
    reducedMotion: "Shows the settled text from the first frame.",
    usedOn: USED_ON,
  },
  {
    id: "scroll-progress",
    name: "ScrollProgress",
    importPath: "@/components/motion/ScrollProgress",
    tagline: "A thin sprung bar across the top showing how far down the page you are.",
    reducedMotion: "Tracks scroll exactly, with no spring smoothing.",
    usedOn: USED_ON,
  },
  {
    id: "magnetic-button",
    name: "MagneticButton",
    importPath: "@/components/motion/MagneticButton",
    tagline: "Leans whatever it wraps toward the pointer, then springs it back.",
    reducedMotion: "Sits still. Also disabled for touch pointers.",
    usedOn: USED_ON,
  },
  {
    id: "animated-number",
    name: "AnimatedNumber",
    importPath: "@/components/motion/AnimatedNumber",
    tagline: "A figure that counts up to its value when it scrolls into view.",
    reducedMotion: "Shows the final figure immediately.",
    usedOn: USED_ON,
  },
  {
    id: "blob-background",
    name: "BlobBackground",
    importPath: "@/components/motion/BlobBackground",
    tagline:
      "Layered organic SVG shapes from a seeded generator, drifting on scroll.",
    reducedMotion: "Static layers, no parallax.",
    usedOn: USED_ON,
  },
  {
    id: "spotlight-card",
    name: "SpotlightCard",
    importPath: "@/components/motion/SpotlightCard",
    tagline:
      "A glass card with a glow that follows the cursor, over the design system's Spotlight.",
    reducedMotion: "Glow pins to the centre and stops tracking.",
    usedOn: USED_ON,
  },
  {
    id: "gradient-mesh",
    name: "GradientMesh",
    importPath: "@/components/motion/GradientMesh",
    tagline: "A slow-drifting mesh of soft colour blooms, in pure CSS.",
    reducedMotion: "Paused by a media query, no JavaScript involved.",
    usedOn: USED_ON,
  },
];
