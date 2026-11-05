/**
 * Builds the LeetCode problem link for a slug. Kept apart from the catalogue
 * so a page can link to LeetCode without bundling every pattern.
 * @param slug - the problem slug, like "two-sum"
 * @returns the full problem url with a trailing slash
 */
export function leetCodeUrl(slug: string): string {
  return `https://leetcode.com/problems/${slug}/`;
}

/**
 * The playbook page for a pattern.
 * @param patternId - the pattern id, like "sliding-window"
 * @returns the site path, like "/learn/interview-prep/sliding-window"
 */
export function patternPath(patternId: string): string {
  return `/learn/interview-prep/${patternId}`;
}
