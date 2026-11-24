// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

/**
 * Coverage numbers said 46 BFF routes were never touched by a test, and they
 * sat that way because nothing noticed. A route is the one place a request
 * meets auth and the upstream URL, so each has to be imported by a test.
 */

const API_ROOT = join("src", "app", "api");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const ALL_FILES = walk("src");
const ROUTES = walk(API_ROOT).filter((file) => file.endsWith(`${sep}route.ts`));
const TEST_SOURCES = ALL_FILES.filter((file) => /\.test\.tsx?$/.test(file)).map(
  (file) => ({ file, text: readFileSync(file, "utf8") }),
);

/** Every spelling a test could use to import this route. */
function importSpecifiers(route: string, testFile: string): string[] {
  const alias = `@/${relative("src", route).split(sep).join("/")}`.replace(
    /\.ts$/,
    "",
  );
  const fromTest = relative(dirname(testFile), route)
    .split(sep)
    .join("/")
    .replace(/\.ts$/, "");
  return [alias, fromTest.startsWith(".") ? fromTest : `./${fromTest}`];
}

/** Whether some test imports this route, by alias or by a relative path. */
function isImportedByATest(route: string): boolean {
  return TEST_SOURCES.some(({ file, text }) =>
    importSpecifiers(route, file).some(
      (specifier) =>
        text.includes(`"${specifier}"`) || text.includes(`'${specifier}'`),
    ),
  );
}

describe("BFF routes", () => {
  it("finds the routes it is meant to police", () => {
    expect(ROUTES.length).toBeGreaterThan(100);
  });

  it("has a test that imports every route", () => {
    const untested = ROUTES.filter((route) => !isImportedByATest(route));
    expect(untested).toEqual([]);
  });
});
