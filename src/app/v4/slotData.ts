import { FEATURES, THOUGHTS } from "@/app/_shared/featureData";
import { groupThoughts } from "@/app/_shared/thoughtCategories";
import type { ThoughtItem } from "@/types/hub";

/** A reel-3 item: the write-up behind whatever is selected in reel 2. */
export type SlotThought = {
  title: string;
  href: string;
  preview: string;
  color: string;
  deprecated?: boolean;
};

/** A reel-2 item: a feature, the resume, or a write-up-only placeholder. */
export type SlotOption = {
  id: string;
  label: string;
  href: string;
  /** External links open in a new tab. */
  external?: boolean;
  color: string;
  /** Short description shown in the result bar. */
  blurb?: string;
  /**
   * A placeholder for a category with no app to open, just write-ups. The reel
   * shows it greyed out and skips it while spinning; reel 3 still carries the
   * write-ups. There is nothing to "Open", so the result bar hides that action.
   */
  disabled?: boolean;
  /** Reel-3 items related to this option. */
  thoughts: SlotThought[];
};

/** A reel-1 item: a top-level bucket the other two reels depend on. */
export type SlotCategory = {
  id: string;
  label: string;
  color: string;
  blurb?: string;
  options: SlotOption[];
};

/** Stable colour per write-up category, same palette the v3 graph uses. */
const CATEGORY_COLORS: Record<string, string> = {
  Features: "#818cf8",
  "Design & UI": "#f472b6",
  Performance: "#34d399",
  "Architecture & Backend": "#a78bfa",
  "Testing & Quality": "#fbbf24",
  Security: "#fb7185",
  "Build & Tooling": "#22d3ee",
  More: "#94a3b8",
  Deprecated: "#94a3b8",
};

const APPS_COLOR = "#38bdf8";
/** Warm accent shared with the resume page entry points elsewhere on the site. */
const RESUME_COLOR = "#fb923c";
const RESUME_BLURB = "Experience, skills, and the projects behind this site.";

const toSlotThought = (thought: ThoughtItem): SlotThought => ({
  title: thought.title,
  href: thought.href,
  preview: thought.preview,
  color: thought.color,
  ...(thought.deprecated ? { deprecated: true } : {}),
});

/**
 * Assemble the three-reel data: an "Apps" category for the features, a resume
 * category, then one category per write-up group. Everything is derived from
 * FEATURES and THOUGHTS, the same source the v3 graph reads, so adding a
 * feature or a write-up shows up here without touching this file.
 */
export function buildSlots(): SlotCategory[] {
  // Same bridge rule as the graph: a feature only links to its write-up when
  // that write-up is still active, so deprecated notes never ride along.
  const activeByHref = new Map(
    THOUGHTS.filter((t) => !t.deprecated).map((t) => [t.href, t]),
  );

  const apps: SlotCategory = {
    id: "apps",
    label: "Apps",
    color: APPS_COLOR,
    blurb: "Things you can actually use.",
    options: FEATURES.map((feature) => {
      const note = feature.thoughtsHref
        ? activeByHref.get(feature.thoughtsHref)
        : undefined;
      return {
        id: `feat:${feature.id}`,
        label: feature.title,
        href: feature.href,
        external: feature.href.startsWith("http"),
        color: feature.color,
        blurb: feature.description,
        thoughts: note ? [toSlotThought(note)] : [],
      };
    }),
  };

  const resume: SlotCategory = {
    id: "resume",
    label: "Résumé",
    color: RESUME_COLOR,
    blurb: RESUME_BLURB,
    options: [
      {
        id: "resume",
        label: "My résumé",
        href: "/resume",
        external: false,
        color: RESUME_COLOR,
        blurb: RESUME_BLURB,
        thoughts: [],
      },
    ],
  };

  // groupThoughts already orders the categories and splits deprecated
  // write-ups into their own trailing group, so they stay reachable here.
  // These categories have no app to open, so reel 2 is a single greyed-out
  // "Write-up only" marker and every write-up lives in reel 3.
  const writing: SlotCategory[] = groupThoughts(THOUGHTS).map((group) => {
    const color = CATEGORY_COLORS[group.name] ?? "#94a3b8";
    return {
      id: `cat:${group.name}`,
      label: group.name,
      color,
      blurb: `${group.items.length} write-ups`,
      options: [
        {
          id: `writeup-only:${group.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          label: "Write-up only",
          href: "",
          color,
          blurb: `No app here, just ${group.items.length} write-ups.`,
          disabled: true,
          thoughts: group.items.map(toSlotThought),
        },
      ],
    };
  });

  return [apps, resume, ...writing];
}

/** Clamp an index into [0, len) treating the list as a wrapping reel. Returns 0 for empty. */
export function wrapIndex(index: number, len: number): number {
  if (len <= 0) return 0;
  return ((index % len) + len) % len;
}

/**
 * Signed number of reel steps on the shortest wrapping path from one index to
 * another. Positive means step forward (down the reel), negative backward.
 * Returns 0 for an empty list.
 */
export function shortestDelta(from: number, to: number, len: number): number {
  if (len <= 0) return 0;
  const forward = wrapIndex(to - from, len);
  return forward > len / 2 ? forward - len : forward;
}
