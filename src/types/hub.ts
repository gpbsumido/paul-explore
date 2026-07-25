/** A feature card shown in the hub grid. */
export interface FeatureItem {
  /** Used to look up the right mini-preview component in PREVIEW_MAP. */
  id: string;
  title: string;
  description: string;
  /** Route for the feature itself. */
  href: string;
  /** Accent color for borders, links, and preview gradients. */
  color: string;
  /** Optional link to the dev-notes write-up for this feature. */
  thoughtsHref?: string;
}

/** A compact link card in the dev-notes section. */
export interface ThoughtItem {
  title: string;
  href: string;
  preview: string;
  color: string;
  /**
   * The write-up documents a feature that no longer exists in the app. It's
   * kept (and reachable) as a page, but dropped from the graphs and shown in a
   * "Deprecated" section on the /thoughts index.
   */
  deprecated?: boolean;
}
