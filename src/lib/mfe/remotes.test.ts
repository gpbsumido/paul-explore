import { describe, it, expect } from "vitest";
import { workPortfolioRemote } from "./remotes";

const PRODUCTION = "https://work-portfolio-mfe.vercel.app/mf-manifest.json";

describe("workPortfolioRemote", () => {
  it("defaults to the remote's production deployment", () => {
    // The in-repo copy is gone, so there is nothing to fall back to: local dev
    // and CI mount the real remote unless told otherwise.
    expect(workPortfolioRemote({})).toEqual({
      name: "workPortfolio",
      manifestUrl: PRODUCTION,
      origin: "https://work-portfolio-mfe.vercel.app",
    });
    expect(workPortfolioRemote({ WORK_PORTFOLIO_REMOTE_URL: "  " })?.manifestUrl).toBe(
      PRODUCTION,
    );
  });

  it("follows WORK_PORTFOLIO_REMOTE_URL, e.g. a local remote on :3100", () => {
    expect(
      workPortfolioRemote({
        WORK_PORTFOLIO_REMOTE_URL: "http://localhost:3100/mf-manifest.json",
      }),
    ).toEqual({
      name: "workPortfolio",
      manifestUrl: "http://localhost:3100/mf-manifest.json",
      origin: "http://localhost:3100",
    });
  });

  it("is absent when the variable is set to something that isn't a URL", () => {
    expect(workPortfolioRemote({ WORK_PORTFOLIO_REMOTE_URL: "nope" })).toBeNull();
  });
});
