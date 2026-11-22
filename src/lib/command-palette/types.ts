/**
 * Types for the site-wide command palette. The logic layer (fuzzy matching,
 * ranking, registry, cursor state) is pure and unit tested; these types are the
 * contract shared between that logic and the thin React combobox that renders it.
 */

/** A contiguous span of a title that matched the query, for highlighting. */
export type MatchRange = {
  /** Index of the first matched character. */
  start: number;
  /** Index one past the last matched character. */
  end: number;
};

/** Section a command is displayed under. */
export type CommandGroup = "Pages" | "Actions" | "Dev Notes";

/** The in-app actions the React shell knows how to run. */
export type CommandAction = "toggle-theme";

/** What every command has, whatever choosing it does. */
type CommandBase = {
  /** Stable unique id, also used to build the option element id. */
  id: string;
  title: string;
  /** Optional secondary line shown under the title. */
  subtitle?: string;
  group: CommandGroup;
  /** Extra terms matched when the title itself misses. */
  keywords: string[];
  /** Accent color for the leading dot. */
  color?: string;
};

/**
 * A single searchable command: a link to a route or another site, or an in-app
 * action. One or the other, so a command can't be built that does nothing.
 */
export type Command =
  | (CommandBase & {
      kind: "link";
      /** Route or URL to navigate to when selected. */
      href: string;
      /** True when `href` points to another site, which opens in a new tab. */
      external: boolean;
    })
  | (CommandBase & { kind: "action"; action: CommandAction });

/** A command paired with its match score and highlight ranges for a query. */
export type RankedCommand = {
  command: Command;
  score: number;
  ranges: MatchRange[];
};

/** Ranked commands bucketed into a single display group. */
export type GroupedCommands = {
  group: CommandGroup;
  commands: RankedCommand[];
};
