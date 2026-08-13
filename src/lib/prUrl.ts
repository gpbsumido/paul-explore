/**
 * Both repos live under the same account, so the owner is a constant rather
 * than another column. Storing a whole URL per row would go stale the moment a
 * repo is renamed; two columns and this function do not.
 */
const OWNER = "gpbsumido";

/** Repo names GitHub actually allows. Anything else is a bad row, not a link. */
const REPO = /^[A-Za-z0-9._-]+$/;

/**
 * The pull request a to-do refers to, or null when there is nothing to link.
 *
 * `pr_repo` is free text in the database, so it is untrusted input on its way
 * into a URL. A name with a slash in it would escape the path and point the
 * chip somewhere else entirely, so it is rejected rather than encoded.
 */
export function pullRequestUrl(
  repo: string | null,
  number: number | null,
): string | null {
  if (!repo || !number) return null;
  if (!REPO.test(repo)) return null;
  if (!Number.isInteger(number) || number <= 0) return null;
  return `https://github.com/${OWNER}/${repo}/pull/${number}`;
}
