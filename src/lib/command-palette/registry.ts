import { FEATURES, THOUGHTS } from "@/app/_shared/featureData.data";
import type { Command } from "./types";
import { isExternalHref } from "@/lib/isExternalHref";

/** A link command to one of this site's own routes. */
function page(command: Omit<Extract<Command, { kind: "link" }>, "kind" | "external">): Command {
  return { ...command, kind: "link", external: false };
}

/**
 * Splits a phrase into lowercased word tokens, used to seed a command's
 * keyword list so a fuzzy query can still hit it when the title itself misses.
 */
function words(...phrases: string[]): string[] {
  const tokens = phrases
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  return Array.from(new Set(tokens));
}

/** Core routes that aren't feature cards but should still be reachable. */
const STATIC_PAGES: Command[] = [
  page({ id: "page-home", title: "Home", group: "Pages", href: "/", keywords: [] }),
  page({
    id: "page-thoughts",
    title: "Dev Notes",
    subtitle: "All write-ups",
    group: "Pages",
    href: "/thoughts",
    keywords: words("thoughts", "notes", "writing", "blog"),
  }),
  page({
    id: "page-settings",
    title: "Settings",
    group: "Pages",
    href: "/settings",
    keywords: words("preferences", "account"),
  }),
  page({
    id: "page-resume",
    title: "Résumé",
    group: "Pages",
    href: "/resume",
    keywords: words("resume", "cv", "work", "experience"),
  }),
];

/** The one non-navigation action: flip between light and dark themes. */
const THEME_ACTION: Command = {
  id: "action-toggle-theme",
  title: "Toggle theme",
  subtitle: "Switch light and dark",
  group: "Actions",
  kind: "action",
  action: "toggle-theme",
  keywords: words("dark", "light", "appearance", "color", "mode"),
};

/**
 * Builds the full command registry from the same FEATURES and THOUGHTS data the
 * hub renders, plus a handful of core static pages and the theme action. Kept as
 * a function (not a constant) so callers can memoize it at mount time and so the
 * data reads stay lazy.
 */
export function buildCommandRegistry(): Command[] {
  const featureCommands: Command[] = FEATURES.map((feature) => ({
    id: `feature-${feature.id}`,
    title: feature.title,
    subtitle: feature.description,
    group: "Pages",
    kind: "link",
    href: feature.href,
    external: isExternalHref(feature.href),
    color: feature.color,
    keywords: words(feature.title, feature.id),
  }));

  const thoughtCommands: Command[] = THOUGHTS.map((thought) =>
    page({
      id: `thought-${thought.href}`,
      title: thought.title,
      subtitle: thought.preview,
      group: "Dev Notes",
      href: thought.href,
      color: thought.color,
      keywords: words(thought.title),
    }),
  );

  return [
    ...STATIC_PAGES,
    ...featureCommands,
    THEME_ACTION,
    ...thoughtCommands,
  ];
}
