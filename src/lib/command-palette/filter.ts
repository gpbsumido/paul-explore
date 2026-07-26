import { fuzzyMatch } from "./fuzzy";
import type {
  Command,
  CommandGroup,
  GroupedCommands,
  RankedCommand,
} from "./types";

/**
 * A keyword hit is worth less than a title hit, so a command whose title
 * matches always outranks one that only matched on a hidden keyword.
 */
const KEYWORD_PENALTY = 0.5;

/** Fixed display order for the groups. Empty groups are dropped downstream. */
const GROUP_ORDER: CommandGroup[] = ["Pages", "Actions", "Dev Notes"];

/**
 * Ranks a registry against a query. The title is matched first; if it misses,
 * the keywords are tried at a reduced score (with no highlight ranges, since
 * those would point into keyword text rather than the visible title). Commands
 * that match neither are dropped. An empty query returns every command in
 * registry order with a neutral score.
 *
 * The sort is stable: commands that tie on score keep their input order.
 */
export function rankCommands(
  commands: readonly Command[],
  query: string,
): RankedCommand[] {
  if (query.length === 0) {
    return commands.map((command) => ({ command, score: 0, ranges: [] }));
  }

  const matches: { ranked: RankedCommand; index: number }[] = [];
  commands.forEach((command, index) => {
    const ranked = rankOne(command, query);
    if (ranked) matches.push({ ranked, index });
  });

  return matches
    .sort((a, b) => b.ranked.score - a.ranked.score || a.index - b.index)
    .map((entry) => entry.ranked);
}

function rankOne(command: Command, query: string): RankedCommand | null {
  const titleMatch = fuzzyMatch(command.title, query);
  if (titleMatch.matched) {
    return { command, score: titleMatch.score, ranges: titleMatch.ranges };
  }

  const keywordScore = command.keywords.reduce((best, keyword) => {
    const match = fuzzyMatch(keyword, query);
    return match.matched ? Math.max(best, match.score) : best;
  }, 0);

  if (keywordScore === 0) return null;
  return { command, score: keywordScore * KEYWORD_PENALTY, ranges: [] };
}

/**
 * Buckets ranked commands into their display groups, preserving rank order
 * within each group and dropping any group with no matches.
 */
export function groupRankedCommands(
  ranked: readonly RankedCommand[],
): GroupedCommands[] {
  return GROUP_ORDER.map((group) => ({
    group,
    commands: ranked.filter((r) => r.command.group === group),
  })).filter((g) => g.commands.length > 0);
}
