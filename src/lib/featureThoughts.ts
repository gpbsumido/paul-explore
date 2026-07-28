import { FEATURES } from "@/app/_shared/featureData.data";

/**
 * Every feature that has a write-up, paired both ways.
 *
 * A feature and its dev-thoughts page are two halves of the same thing, but
 * until now you could only get from one to the other by going back to the hub.
 * The pairing already exists in the feature data (`thoughtsHref`); this just
 * makes it navigable in both directions.
 */
export type Counterpart = {
  /** Where the link goes. */
  href: string;
  /** What to call it, e.g. "Gallery Wall". */
  title: string;
  /** Which way we're travelling, so the label can read naturally. */
  direction: "to-thoughts" | "to-feature";
};

/** Trim a trailing slash so "/craft/" and "/craft" match the same feature. */
const normalize = (pathname: string): string =>
  pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

/**
 * The other half of the page you're on: a feature's write-up, or the feature a
 * write-up is about. Null when the current page isn't half of a pair, which is
 * most of them.
 */
export function counterpartFor(pathname: string | null): Counterpart | null {
  if (!pathname) return null;
  const path = normalize(pathname);

  for (const feature of FEATURES) {
    if (!feature.thoughtsHref) continue;
    if (path === feature.href) {
      return {
        href: feature.thoughtsHref,
        title: feature.title,
        direction: "to-thoughts",
      };
    }
    if (path === feature.thoughtsHref) {
      return { href: feature.href, title: feature.title, direction: "to-feature" };
    }
  }
  return null;
}
