/**
 * What /discover is now.
 *
 * While v4 rendered at `/`, discover held three retired landings plus the
 * current one, and the banner was a warning that you were looking at something
 * stale. v5 took over `/`, so every generation discover holds is history and
 * the banner is a caption on all of them. Keeping that decision as a pure
 * module rather than a branch inside the page is what makes it testable, since
 * the page itself is an async server component behind a session lookup.
 */

/** Every retired landing generation, oldest first. */
export const ARCHIVED_VERSIONS = ["v1", "v2", "v3", "v4"] as const;

export type ArchivedVersion = (typeof ARCHIVED_VERSIONS)[number];

/** Whether a version param names a landing this archive still serves. */
export function isArchived(version: string): version is ArchivedVersion {
  return (ARCHIVED_VERSIONS as readonly string[]).includes(version);
}

/**
 * The banner caption for one archived generation.
 *
 * Deliberately not the old "you're viewing an older version" wording. Nothing
 * here is a wrong turn to be corrected: it is a museum, and the label says so.
 * The banner supplies the link to the current landing after this sentence.
 */
export function archiveLabel(version: string): string {
  return `Landing-page history: ${version}`;
}
