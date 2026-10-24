/**
 * The intro video's scenes, in order. The recorder burns each caption into
 * its frames for that many seconds, and the welcome page writes the same
 * captions out as the video's transcript, so the two can't drift apart.
 */
export type IntroScene = { id: string; caption: string; seconds: number };

export const INTRO_SCENES: readonly IntroScene[] = [
  { id: "title", caption: "EVAR Sizing: practise the measurements behind an aneurysm repair.", seconds: 3 },
  {
    id: "study",
    caption: "First, you're asked whether you'd like to join a study of how this skill grows. It's optional.",
    seconds: 6,
  },
  { id: "scan", caption: "Each case is a CT scan: a real, deidentified one, or a synthetic phantom.", seconds: 5 },
  { id: "slices", caption: "Scroll down through the slices to just below the kidneys, where the neck starts.", seconds: 5 },
  { id: "caliper", caption: "Zoom in and put calipers across the aorta to measure the neck.", seconds: 5 },
  {
    id: "record",
    caption: "Record all five: the neck's width and length, the widest part of the sac, and both iliacs.",
    seconds: 6,
  },
  { id: "graft", caption: "Then pick a main body and limbs from a maker's sizing table.", seconds: 5 },
  { id: "results", caption: "Check your answers: every number against the reference, with stars and points.", seconds: 6 },
  {
    id: "end",
    caption: "It's free. Join the study and your attempts help show how sizing skill grows over training.",
    seconds: 6,
  },
];

/** How long the video runs, in seconds. */
export const introSeconds = () => INTRO_SCENES.reduce((sum, scene) => sum + scene.seconds, 0);
