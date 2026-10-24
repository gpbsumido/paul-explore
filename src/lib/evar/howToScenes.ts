import type { IntroScene } from "./introScenes";

/**
 * The how-to-measure video's scenes, in the order the measurements are taken.
 * The recorder burns each caption into its frames for that many seconds, and
 * the welcome page and the guide write them out as the transcript. The
 * wording follows what the practice grades: outer wall to outer wall, the
 * short axis on an oval neck, and a neck that ends where the aorta first
 * widens by more than 10%.
 */
export const HOW_TO_SCENES: readonly IntroScene[] = [
  { id: "title", caption: "How to measure for an EVAR.", seconds: 3 },
  {
    id: "renal",
    caption: "Scroll down until the lowest renal artery leaves the aorta. The neck starts just below it.",
    seconds: 6,
  },
  {
    id: "diameter",
    caption: "Measure the neck from outer wall to outer wall, across the short axis if it's oval.",
    seconds: 6,
  },
  {
    id: "wall",
    caption: "Thrombus and calcium sit inside the wall, so the outer edge is still the one to measure.",
    seconds: 6,
  },
  {
    id: "length",
    caption: "Mark the lowest renal, then the slice where the aorta first widens by more than 10%.",
    seconds: 6,
  },
  { id: "sac", caption: "Find the widest slice of the sac and measure it outer wall to outer wall.", seconds: 5 },
  {
    id: "iliacs",
    caption: "Below the bifurcation, measure each common iliac where the limb will seal.",
    seconds: 5,
  },
  {
    id: "graft",
    caption: "Then pick the main body from the neck's diameter and each limb from its iliac.",
    seconds: 6,
  },
  {
    id: "check",
    caption: "Check your answers. On Medium, diameters count within 2 mm and the neck length within 5 mm.",
    seconds: 6,
  },
  { id: "end", caption: "The guide goes through every step with pictures. Start on Easy.", seconds: 5 },
];

/** How long the how-to video runs, in seconds. */
export const howToSeconds = () => HOW_TO_SCENES.reduce((sum, scene) => sum + scene.seconds, 0);
