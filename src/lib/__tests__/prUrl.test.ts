import { describe, it, expect } from "vitest";
import { pullRequestUrl } from "../prUrl";

describe("linking a to-do to its pull request", () => {
  it("builds the url from the repo and number", () => {
    expect(pullRequestUrl("portfolio_api", 137)).toBe(
      "https://github.com/gpbsumido/portfolio_api/pull/137",
    );
  });

  it("has nothing to link when either half is missing", () => {
    // Most items have no PR at all, which is not a problem to report.
    expect(pullRequestUrl(null, 137)).toBeNull();
    expect(pullRequestUrl("portfolio_api", null)).toBeNull();
    expect(pullRequestUrl(null, null)).toBeNull();
  });

  it("refuses a repo name that would escape the path", () => {
    // pr_repo is free text in the database, so it is untrusted input that ends
    // up inside a URL. A name with a slash in it is a bad row, not a link.
    expect(pullRequestUrl("../../evil", 1)).toBeNull();
    expect(pullRequestUrl("owner/repo", 1)).toBeNull();
    expect(pullRequestUrl("has space", 1)).toBeNull();
    expect(pullRequestUrl("", 1)).toBeNull();
  });

  it("refuses a number that is not a positive integer", () => {
    expect(pullRequestUrl("portfolio_api", 0)).toBeNull();
    expect(pullRequestUrl("portfolio_api", -3)).toBeNull();
    expect(pullRequestUrl("portfolio_api", 1.5)).toBeNull();
  });

  it("accepts the punctuation real repo names use", () => {
    expect(pullRequestUrl("paul-explore", 362)).toBe(
      "https://github.com/gpbsumido/paul-explore/pull/362",
    );
    expect(pullRequestUrl("paul.design.system", 4)).toBe(
      "https://github.com/gpbsumido/paul.design.system/pull/4",
    );
  });
});
