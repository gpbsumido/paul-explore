import { describe, it, expect, vi } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Black-box: these run the real script against real child processes, because
 * the thing it exists for is killing a stalled process tree, and a mocked spawn
 * can't show that a grandchild actually died.
 */

const SCRIPT = join(process.cwd(), "scripts/with-retries.mjs");

/**
 * A stand-in command that counts its runs in a file and then does what its
 * plan says for that run: `ok`, `fail`, or `hang` (after starting a child that
 * also hangs, the way pnpm starts sudo and apt). `hang-stubborn-child` is a hang
 * whose child ignores SIGTERM, and `hang-then-exit-zero-on-term` is a hang that
 * exits 0 once it is asked to stop.
 */
const FIXTURE = `
const fs = require("node:fs");
const { spawn } = require("node:child_process");
const [dir, ...plan] = process.argv.slice(1);
const countFile = dir + "/count";
const run = fs.existsSync(countFile) ? Number(fs.readFileSync(countFile, "utf8")) + 1 : 1;
fs.writeFileSync(countFile, String(run));
fs.writeFileSync(dir + "/attempt-" + run, String(process.env.WITH_RETRIES_ATTEMPT));
const step = plan[Math.min(run, plan.length) - 1];
if (step === "ok") process.exit(0);
if (step === "fail") process.exit(7);
const stubborn = step === "hang-stubborn-child";
const childSource = (stubborn ? "process.on('SIGTERM', () => {});" : "") + "setInterval(() => {}, 1000)";
const child = spawn(process.execPath, ["-e", childSource], { stdio: "ignore" });
fs.writeFileSync(dir + "/grandchild", String(child.pid));
if (step === "hang-then-exit-zero-on-term") process.on("SIGTERM", () => process.exit(0));
setInterval(() => {}, 1000);
`;

const scratch = () => mkdtempSync(join(tmpdir(), "with-retries-"));

const runWithRetries = (dir: string, args: { attempts: number; timeout: number; plan: string[] }) =>
  spawnSync(
    process.execPath,
    [
      SCRIPT,
      "--attempts",
      String(args.attempts),
      "--timeout",
      String(args.timeout),
      "--",
      process.execPath,
      "-e",
      FIXTURE,
      dir,
      ...args.plan,
    ],
    { encoding: "utf8", timeout: 20_000 },
  );

const runs = (dir: string) => Number(readFileSync(join(dir, "count"), "utf8"));

const alive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const warnings = (stdout: string) => stdout.split("\n").filter((l) => l.startsWith("::warning"));

describe("with-retries", () => {
  it("runs the command once when it works", () => {
    const dir = scratch();
    const result = runWithRetries(dir, { attempts: 3, timeout: 10, plan: ["ok"] });

    expect(result.status).toBe(0);
    expect(runs(dir)).toBe(1);
    expect(warnings(result.stdout)).toEqual([]);
  });

  it("tries again after a failure, and says so in a CI annotation", () => {
    const dir = scratch();
    const result = runWithRetries(dir, { attempts: 3, timeout: 10, plan: ["fail", "fail", "ok"] });

    expect(result.status).toBe(0);
    expect(runs(dir)).toBe(3);
    expect(warnings(result.stdout)).toHaveLength(2);
    expect(warnings(result.stdout)[0]).toMatch(/attempt 1 of 3 exited with 7/);
  });

  it("tells each attempt which one it is, so a retry can clean up after the last", () => {
    const dir = scratch();
    runWithRetries(dir, { attempts: 3, timeout: 10, plan: ["fail", "ok"] });

    expect(readFileSync(join(dir, "attempt-1"), "utf8")).toBe("1");
    expect(readFileSync(join(dir, "attempt-2"), "utf8")).toBe("2");
  });

  it("gives up after the last attempt with the command's own exit code", () => {
    const dir = scratch();
    const result = runWithRetries(dir, { attempts: 3, timeout: 10, plan: ["fail"] });

    expect(result.status).toBe(7);
    expect(runs(dir)).toBe(3);
  });

  it("kills a stalled attempt and everything it started, then tries again", () => {
    const dir = scratch();
    const started = Date.now();
    const result = runWithRetries(dir, { attempts: 2, timeout: 1, plan: ["hang", "ok"] });

    expect(result.status).toBe(0);
    expect(runs(dir)).toBe(2);
    expect(Date.now() - started).toBeLessThan(10_000);
    expect(warnings(result.stdout)[0]).toMatch(/attempt 1 of 2 timed out after 1s/);
    expect(existsSync(join(dir, "grandchild"))).toBe(true);
    expect(alive(Number(readFileSync(join(dir, "grandchild"), "utf8")))).toBe(false);
  });

  it("exits 124 when the last attempt timed out, so a stall isn't mistaken for the command's own failure", () => {
    const dir = scratch();
    const result = runWithRetries(dir, { attempts: 1, timeout: 1, plan: ["hang"] });

    expect(result.status).toBe(124);
    expect(result.stdout).toMatch(/::error title=Gave up::attempt 1 of 1 timed out after 1s/);
  });

  it("finishes off a child that ignores the polite stop, so the next attempt starts clean", async () => {
    const dir = scratch();
    const result = runWithRetries(dir, { attempts: 2, timeout: 1, plan: ["hang-stubborn-child", "ok"] });

    expect(result.status).toBe(0);
    const grandchild = Number(readFileSync(join(dir, "grandchild"), "utf8"));
    await vi.waitFor(() => expect(alive(grandchild)).toBe(false), { timeout: 2000 });
  });

  it("counts a timed-out attempt as failed even when it exits 0 on the way down", () => {
    const dir = scratch();
    const result = runWithRetries(dir, { attempts: 2, timeout: 1, plan: ["hang-then-exit-zero-on-term", "ok"] });

    expect(result.status).toBe(0);
    expect(runs(dir)).toBe(2);
    expect(warnings(result.stdout)[0]).toMatch(/attempt 1 of 2 timed out/);
  });

  it.each([
    ["no command after --", ["--attempts", "2", "--timeout", "5", "--"]],
    ["no -- at all", ["--attempts", "2", "--timeout", "5", "true"]],
    ["zero attempts", ["--attempts", "0", "--timeout", "5", "--", "true"]],
    ["a non-numeric timeout", ["--attempts", "2", "--timeout", "soon", "--", "true"]],
  ])("refuses to run with %s, and prints the usage", (_name, args) => {
    const result = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8", timeout: 10_000 });

    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/usage: with-retries\.mjs/);
  });
});
