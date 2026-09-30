import { describe, it, expect } from "vitest";
import { workPortfolioRemote, servesWorkPortfolioRemote } from "./remotes";

const URL_ = "https://work-portfolio-mfe.vercel.app/mf-manifest.json";

describe("workPortfolioRemote", () => {
  it("reads the manifest URL and derives the origin the CSP needs", () => {
    expect(workPortfolioRemote({ WORK_PORTFOLIO_REMOTE_URL: URL_ })).toEqual({
      name: "workPortfolio",
      manifestUrl: URL_,
      origin: "https://work-portfolio-mfe.vercel.app",
    });
  });

  it("is absent when the variable is unset, blank or not a URL", () => {
    expect(workPortfolioRemote({})).toBeNull();
    expect(workPortfolioRemote({ WORK_PORTFOLIO_REMOTE_URL: "  " })).toBeNull();
    expect(workPortfolioRemote({ WORK_PORTFOLIO_REMOTE_URL: "nope" })).toBeNull();
  });
});

describe("servesWorkPortfolioRemote", () => {
  const remote = workPortfolioRemote({ WORK_PORTFOLIO_REMOTE_URL: URL_ });

  it("never serves the remote when none is configured, whatever the flag says", () => {
    expect(servesWorkPortfolioRemote({ remote: null, override: "on", flagOn: true })).toBe(false);
  });

  it("follows the flag when there is no override", () => {
    expect(servesWorkPortfolioRemote({ remote, override: null, flagOn: true })).toBe(true);
    expect(servesWorkPortfolioRemote({ remote, override: null, flagOn: false })).toBe(false);
  });

  it("lets the override win both ways, for e2e and as a kill switch", () => {
    expect(servesWorkPortfolioRemote({ remote, override: "on", flagOn: false })).toBe(true);
    expect(servesWorkPortfolioRemote({ remote, override: "off", flagOn: true })).toBe(false);
  });
});
