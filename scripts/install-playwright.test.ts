import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * The install runs as root on a CI runner, so these put stand-ins for sudo and
 * pnpm first on PATH that only write down how they were called. That checks
 * what each attempt asks for, without touching apt on the machine running the
 * tests.
 */

const SCRIPT = join(process.cwd(), "scripts/install-playwright.sh");

const stub = (dir: string, name: string) => {
  const file = join(dir, name);
  writeFileSync(file, `#!/bin/sh\necho "${name} $*" >> "$CALLS"\n`);
  chmodSync(file, 0o755);
};

const attempt = (n: string | undefined) => {
  const dir = mkdtempSync(join(tmpdir(), "install-playwright-"));
  stub(dir, "sudo");
  stub(dir, "pnpm");
  const calls = join(dir, "calls");
  writeFileSync(calls, "");
  const env = { ...process.env, PATH: `${dir}:${process.env.PATH}`, CALLS: calls, WITH_RETRIES_ATTEMPT: n };
  if (n === undefined) delete env.WITH_RETRIES_ATTEMPT;
  const result = spawnSync("bash", [SCRIPT], { env, encoding: "utf8" });
  return { status: result.status, calls: readFileSync(calls, "utf8").trim().split("\n") };
};

const INSTALL = "pnpm exec playwright install chromium --with-deps";

describe("install-playwright", () => {
  it("goes straight to the install on the first attempt", () => {
    expect(attempt("1")).toEqual({ status: 0, calls: [INSTALL] });
  });

  it("treats a run outside with-retries as a first attempt", () => {
    expect(attempt(undefined)).toEqual({ status: 0, calls: [INSTALL] });
  });

  it("clears what a killed attempt left of apt and dpkg before trying again", () => {
    const { status, calls } = attempt("2");

    expect(status).toBe(0);
    expect(calls.at(-1)).toBe(INSTALL);
    expect(calls).toContain("sudo pkill -KILL -x apt-get");
    expect(calls).toContain("sudo pkill -KILL -x dpkg");
    expect(calls.indexOf("sudo dpkg --configure -a")).toBeGreaterThan(calls.indexOf("sudo pkill -KILL -x dpkg"));
    expect(calls.indexOf("sudo dpkg --configure -a")).toBeLessThan(calls.length - 1);
  });
});
