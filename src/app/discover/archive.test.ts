import { describe, it, expect } from "vitest";
import { ARCHIVED_VERSIONS, archiveLabel, isArchived } from "./archive";

/**
 * /discover stopped being "the landing page, plus a switch to older ones" when
 * v5 took over /. Every generation it holds is history now, v4 included, so the
 * banner is a caption on all of them rather than a warning on some of them.
 */
describe("the /discover archive", () => {
  it("holds every retired generation, v4 included", () => {
    expect(ARCHIVED_VERSIONS).toEqual(["v1", "v2", "v3", "v4"]);
  });

  it("treats every version it holds as history", () => {
    for (const version of ARCHIVED_VERSIONS) {
      expect(isArchived(version)).toBe(true);
    }
  });

  it("labels each one as landing-page history rather than as stale", () => {
    for (const version of ARCHIVED_VERSIONS) {
      const label = archiveLabel(version);
      expect(label).toContain(version);
      expect(label).toMatch(/landing-page history/i);
    }
  });

  it("says where the current one lives, since that is the useful next click", () => {
    expect(archiveLabel("v4")).toMatch(/current version lives at \//i);
  });

  it("carries no em-dash, the tell this whole redesign is removing", () => {
    for (const version of ARCHIVED_VERSIONS) {
      expect(archiveLabel(version)).not.toMatch(/[—–]/);
    }
  });
});
