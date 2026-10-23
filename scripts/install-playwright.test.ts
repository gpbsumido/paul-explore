import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * The install runs as root on a CI runner, so these put stand-ins for sudo,
 * pnpm and node first on PATH that only write down how they were called. That
 * checks what each attempt asks for, without touching apt or launching a
 * browser on the machine running the tests. The node stand-in plays the
 * launch check, passing or failing as each test says.
 */

const SCRIPT = join(process.cwd(), "scripts/install-playwright.sh");

const stub = (dir: string, name: string, exitCode = 0) => {
  const file = join(dir, name);
  writeFileSync(file, `#!/bin/sh\necho "${name} $*" >> "$CALLS"\nexit ${exitCode}\n`);
  chmodSync(file, 0o755);
};

const attempt = (n: string | undefined, { launches = true } = {}) => {
  const dir = mkdtempSync(join(tmpdir(), "install-playwright-"));
  stub(dir, "sudo");
  stub(dir, "pnpm");
  stub(dir, "node", launches ? 0 : 1);
  const calls = join(dir, "calls");
  writeFileSync(calls, "");
  const env = { ...process.env, PATH: `${dir}:${process.env.PATH}`, CALLS: calls, WITH_RETRIES_ATTEMPT: n };
  if (n === undefined) delete env.WITH_RETRIES_ATTEMPT;
  const result = spawnSync("bash", [SCRIPT], { env, encoding: "utf8" });
  return { status: result.status, calls: readFileSync(calls, "utf8").trim().split("\n") };
};

const BROWSER = "pnpm exec playwright install chromium";
const LAUNCH_CHECK = "node scripts/chromium-launches.mjs";
const SYSTEM_PACKAGES = "pnpm exec playwright install-deps chromium";

describe("install-playwright", () => {
  // On a slow mirror, apt is what stalls, so it only runs when Chromium needs it.
  it("installs the browser and leaves apt alone when Chromium already starts", () => {
    expect(attempt("1")).toEqual({ status: 0, calls: [BROWSER, LAUNCH_CHECK] });
  });

  it("installs Chromium's system packages when it won't start without them", () => {
    expect(attempt("1", { launches: false })).toEqual({ status: 0, calls: [BROWSER, LAUNCH_CHECK, SYSTEM_PACKAGES] });
  });

  it("treats a run outside with-retries as a first attempt", () => {
    expect(attempt(undefined)).toEqual({ status: 0, calls: [BROWSER, LAUNCH_CHECK] });
  });

  it("clears what a killed attempt left of apt and dpkg before trying again", () => {
    const { status, calls } = attempt("2", { launches: false });

    expect(status).toBe(0);
    expect(calls.at(-1)).toBe(SYSTEM_PACKAGES);
    expect(calls).toContain("sudo pkill -KILL -x apt-get");
    expect(calls).toContain("sudo pkill -KILL -x dpkg");
    expect(calls.indexOf("sudo dpkg --configure -a")).toBeGreaterThan(calls.indexOf("sudo pkill -KILL -x dpkg"));
    expect(calls.indexOf("sudo dpkg --configure -a")).toBeLessThan(calls.indexOf(BROWSER));
  });
});
