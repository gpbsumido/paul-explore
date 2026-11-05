import { PATTERNS, patternById } from "@/lib/leetcode/patterns";
import { solutionsForPattern } from "@/lib/leetcode/solutionCatalog";
import type { Pattern } from "@/lib/leetcode/types";

export type PatternLink = { id: string; name: string };

/**
 * Everything a pattern page renders, resolved on the server. The client
 * component gets this one pattern and the names of its neighbours rather than
 * importing the whole catalogue, which kept about 64KB of other patterns'
 * text in every pattern page's JavaScript.
 * @param patternId - the pattern's url id
 * @returns the pattern, the patterns either side of it and the ones it builds
 *   on (as links), and its ladder's solutions
 */
export function patternPageProps(patternId: string) {
  const pattern = patternById(patternId);
  if (!pattern) throw new Error(`No pattern with id "${patternId}"`);
  const index = PATTERNS.indexOf(pattern);
  const linkTo = (target: Pattern | undefined): PatternLink | null => (target ? { id: target.id, name: target.name } : null);
  return {
    pattern,
    previous: linkTo(PATTERNS[index - 1]),
    next: linkTo(PATTERNS[index + 1]),
    builtOn: pattern.prerequisites.map((id) => {
      const prerequisite = linkTo(patternById(id));
      if (!prerequisite) throw new Error(`"${patternId}" builds on "${id}", which isn't a pattern`);
      return prerequisite;
    }),
    solutions: solutionsForPattern(pattern),
  };
}
