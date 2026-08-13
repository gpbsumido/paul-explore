import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(process.cwd(), "src");

/**
 * featureData.tsx is a "use client" barrel: it pulls in framer-motion and the
 * animated preview components, then re-exports the plain arrays from
 * featureData.data for convenience. Importing it just to read FEATURES or
 * THOUGHTS drags all of that into the importing route's bundle.
 *
 * These are the files that genuinely render the preview components, so the
 * barrel is the right import for them. Anything else wanting the data should
 * import featureData.data directly.
 *
 * The command palette registry is the reason this test exists -- it sat in the
 * root layout, so its barrel import leaked framer-motion into every route in
 * the app to read two arrays.
 */
const RENDERS_PREVIEW_COMPONENTS = [
  "src/app/FeatureHub.tsx",
  "src/app/pokemon/PokemonHub.tsx",
  "src/app/v2/FeatureHubV2.tsx",
  "src/app/v2/landing/ProjectsSection.tsx",
];

const BARREL_IMPORT = /from\s+"@\/app\/_shared\/featureData"/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [path] : [];
  });
}

describe("featureData barrel imports", () => {
  it("is only imported by files that render the preview components", () => {
    const importers = sourceFiles(SRC)
      .filter((path) => BARREL_IMPORT.test(readFileSync(path, "utf8")))
      .map((path) => path.slice(process.cwd().length + 1))
      .sort();

    expect(importers).toEqual([...RENDERS_PREVIEW_COMPONENTS].sort());
  });
});
