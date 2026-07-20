/**
 * Data model for the work-portfolio page. One catalog drives both tickers,
 * the demo stage, the explainer windows, and deep links.
 */

/** Visual accent each project's demos carry inside the stage. */
export type AccentTheme = {
  /** primary accent color, hex */
  accent: string;
  /** translucent surface tint used behind demo content */
  surface: string;
  /** typography flavor for the demo surface */
  font: "sans" | "mono";
};

/** One of the 11 past projects. Names are public-safe, never the real ones. */
export type WorkProject = {
  id: string;
  /** anonymized public name shown in the top ticker */
  name: string;
  /** one-liner for the explainer window */
  blurb: string;
  /** original stack, described without identifying details */
  stack: string;
  accent: AccentTheme;
  /** features that did not make the ticker, listed in the explainer */
  cutFeatures: string[];
};

/** One of the 24 demoable features shown in the bottom ticker. */
export type WorkFeature = {
  /** url-safe id, used for ?feature= deep links */
  slug: string;
  projectId: string;
  title: string;
  /** short line shown on the chip and stage header */
  tagline: string;
  /** small emoji icon shown on the chip */
  icon: string;
  /** flagship demos get more depth than vignettes */
  flagship?: boolean;
  explainer: {
    /** what the feature did in the original app */
    did: string;
    /** what it was built with originally */
    stack: string;
    /** what is real vs faked in this reconstruction */
    mocked: string;
  };
};
