import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Loads playwright.config.ts the way CI does, with CI set, and hands back the
 * reporter list it resolves to.
 */
async function reportersOnCi() {
  vi.stubEnv("CI", "true");
  vi.resetModules();
  const { default: config } = await import("../playwright.config");
  return config.reporter;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("playwright reporters on CI", () => {
  it("names every test with its time, so a slow spec can be pinned to a route", async () => {
    const reporters = await reportersOnCi();
    expect(reporters).toContainEqual(["list"]);
  });

  it("still annotates the run in GitHub", async () => {
    const reporters = await reportersOnCi();
    expect(reporters).toContainEqual(["github"]);
  });

  it("writes an HTML report, so a red run has something to download", async () => {
    const reporters = await reportersOnCi();
    expect(reporters).toContainEqual(["html", { open: "never" }]);
  });

  it("keeps the local default, an HTML report that opens on failure", async () => {
    vi.stubEnv("CI", "");
    vi.resetModules();
    const { default: config } = await import("../playwright.config");
    expect(config.reporter).toBe("html");
  });
});
