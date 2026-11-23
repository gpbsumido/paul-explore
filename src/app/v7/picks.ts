import { PROJECT_PICKS, featureFor } from "../v6/picks";
import { STACK } from "../v6/stack";
import packageJson from "../../../package.json";

/**
 * The four tiles in the v7 work grid, in grid order. The offset layout is built
 * for exactly four (7/5 then 5/7 columns), so this is a shortlist, not a filter.
 * Notes and categories come from the v6 picks so the two stay one source.
 */
export const WORK_PICK_IDS = ["work-portfolio", "design-system", "world", "operator"] as const;

export type WorkTile = {
  id: string;
  title: string;
  href: string;
  note: string;
  category: string;
};

/** The work grid's tiles, resolved through the hub so a renamed feature fails loudly. */
export function workTiles(): WorkTile[] {
  return WORK_PICK_IDS.map((id) => {
    const pick = PROJECT_PICKS.find((candidate) => candidate.id === id);
    if (!pick) throw new Error(`v7 work grid picks "${id}", which has no v6 pick note`);
    const { title, href } = featureFor(id);
    return { id, title, href, note: pick.note, category: pick.category };
  });
}

const DEPENDENCY_RANGES: Record<string, string> = {
  ...packageJson.devDependencies,
  ...packageJson.dependencies,
};

/**
 * The version a stack entry shows in the marquee: the major, or major.minor
 * while a package is still 0.x, read from package.json so it can't drift.
 */
export function shownVersion(range: string): string {
  const [major, minor] = range.replace(/^[^\d]*/, "").split(".");
  return major === "0" ? `${major}.${minor}` : major;
}

/** Every stack entry with the version installed right now. */
export function stackWithVersions() {
  return STACK.map((entry) => {
    const range = DEPENDENCY_RANGES[entry.pkg];
    if (!range) throw new Error(`Stack lists "${entry.pkg}", which package.json doesn't have`);
    return { ...entry, version: shownVersion(range) };
  });
}
