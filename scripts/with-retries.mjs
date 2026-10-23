// Runs a command, and runs it again if it fails or stalls.
//
// Written for the Playwright install in CI. `playwright install --with-deps`
// runs apt under sudo, and on some runners apt sits on a dead mirror until the
// step's timeout-minutes kills the job. A rerun of the same commit goes through
// in ten seconds, so the right response to a stall is to give up on that
// attempt early and try again, not to wait ten minutes and fail the build.
//
// Each attempt runs in its own process group, so a stall kills what the attempt
// started, not just the top process. A kill can't reach everything under sudo,
// so each attempt also gets its number in WITH_RETRIES_ATTEMPT and a retry can
// clean up after the one before. Every retry writes a GitHub Actions warning,
// which shows up in the run's annotations, so how often this is earning its
// keep can be read off the API.
//
// Usage: node scripts/with-retries.mjs --attempts 3 --timeout 240 -- <command> [args...]

import { spawn } from "node:child_process";

const USAGE = "usage: with-retries.mjs --attempts <n> --timeout <seconds> -- <command> [args...]";

/** Grace period between asking a stalled attempt to stop and forcing it to. */
const KILL_GRACE_MS = 5000;

/** Exit code when the last attempt timed out, the same one coreutils `timeout` uses. */
const TIMED_OUT = 124;

/**
 * Reads the flags and the command after `--`. Returns null for anything that
 * isn't a usable set of arguments.
 *
 * @param {string[]} argv
 * @returns {{ attempts: number, timeoutS: number, command: string, args: string[] } | null}
 */
function parseArgs(argv) {
  const split = argv.indexOf("--");
  if (split === -1 || split === argv.length - 1) return null;
  const flags = argv.slice(0, split);
  const flag = (name) => {
    const i = flags.indexOf(name);
    return i === -1 ? NaN : Number(flags[i + 1]);
  };
  const attempts = flag("--attempts");
  const timeoutS = flag("--timeout");
  if (!Number.isInteger(attempts) || attempts < 1 || !(timeoutS > 0)) return null;
  const [command, ...args] = argv.slice(split + 1);
  return { attempts, timeoutS, command, args };
}

/** Signals a whole process group, ignoring one that's already gone. */
const killGroup = (pid, signal) => {
  try {
    process.kill(-pid, signal);
  } catch {
    // Already exited.
  }
};

/**
 * One attempt. Resolves with the exit code, or `timedOut` when it had to be
 * killed.
 *
 * @returns {Promise<{ code: number, timedOut: boolean }>}
 */
function runOnce({ command, args, timeoutS, attempt }) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      detached: true,
      env: { ...process.env, WITH_RETRIES_ATTEMPT: String(attempt) },
    });
    let timedOut = false;
    let force;
    const timer = setTimeout(() => {
      timedOut = true;
      killGroup(child.pid, "SIGTERM");
      force = setTimeout(() => killGroup(child.pid, "SIGKILL"), KILL_GRACE_MS);
    }, timeoutS * 1000);

    child.on("error", () => {
      clearTimeout(timer);
      resolve({ code: 127, timedOut: false });
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      clearTimeout(force);
      // Anything the attempt left running in its group goes with it. That
      // doesn't reach everything: sudo can run its command in a session of
      // its own and passes on SIGTERM but not SIGKILL, which is why the
      // command gets WITH_RETRIES_ATTEMPT to clean up after a killed attempt.
      if (timedOut) killGroup(child.pid, "SIGKILL");
      resolve({ code: code ?? 1, timedOut });
    });
  });
}

/** Runs the attempts in order and exits with the last one's result. */
async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed === null) {
    console.error(USAGE);
    process.exit(2);
  }
  const { attempts } = parsed;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const { code, timedOut } = await runOnce({ ...parsed, attempt });
    if (code === 0 && !timedOut) process.exit(0);

    const what = timedOut ? `timed out after ${parsed.timeoutS}s` : `exited with ${code}`;
    if (attempt === attempts) {
      console.log(`::error title=Gave up::attempt ${attempt} of ${attempts} ${what}: ${parsed.command} ${parsed.args.join(" ")}`);
      process.exit(timedOut ? TIMED_OUT : code);
    }
    console.log(`::warning title=Retrying::attempt ${attempt} of ${attempts} ${what}, trying again: ${parsed.command} ${parsed.args.join(" ")}`);
  }
}

main();
