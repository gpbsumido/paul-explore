// Wraps ts-prune to fail CI on genuinely-dead exports.
//
// ts-prune's own --error flag counts every reported export, including the
// "(used in module)" ones — exports that are only consumed inside their own
// file. Those aren't dead code (dropping the export keyword can break tests
// that import them), just a mild smell, and there are dozens of them. We want
// the blocking check to fire only on exports that nothing imports at all.
//
// Path-level ignores (framework-convention files, the ui barrel, generated
// files) live in .ts-prunerc.json, which ts-prune reads automatically.

import { execFileSync } from "node:child_process";

/** Run ts-prune and return its stdout, tolerating its non-zero exit codes. */
function runTsPrune() {
  try {
    return execFileSync("ts-prune", { encoding: "utf8" });
  } catch (err) {
    // ts-prune exits non-zero when it finds anything; we do our own gating,
    // so fall back to whatever it printed on stdout.
    if (typeof err.stdout === "string") return err.stdout;
    throw err;
  }
}

const deadExports = runTsPrune()
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.length > 0 && !line.includes("(used in module)"));

if (deadExports.length > 0) {
  console.error(
    `Found ${deadExports.length} dead export(s) — nothing imports these:\n`,
  );
  for (const line of deadExports) console.error(`  ${line}`);
  console.error(
    "\nRemove the export, or if it's intentionally public add a" +
      " // ts-prune-ignore-next comment above it with a reason.",
  );
  process.exit(1);
}

console.log("No dead exports found.");
