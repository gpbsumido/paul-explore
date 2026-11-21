import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

// Two Vitest tiers (see the tiered testing strategy write-up at
// /thoughts/test-tiers):
//   unit        - fast, isolated tests. Run on every push and PR via `pnpm test`.
//   integration - a component or route rendered against its real data layer
//                 (react-query + MSW). Heavier, so they run on merge and nightly
//                 via `pnpm test:integration`, not on every push.
// Integration tests opt in with a `.integration.test.tsx` filename suffix.
const integrationGlob = "src/**/*.integration.{test,spec}.{ts,tsx}";
// Svelte components get their own project: they need the compiler plugin and
// the "browser" resolve condition (otherwise `svelte` resolves to its server
// build, where `mount` throws), and neither belongs in the React tests.
const svelteGlob = "src/**/*.svelte.test.ts";

const shuffleTests = Boolean(process.env.CI) || Boolean(process.env.VITEST_SEED);
const shuffleSeed = Number(process.env.VITEST_SEED) || Date.now();
if (shuffleTests && !process.env.VITEST_SEED_LOGGED) {
  process.env.VITEST_SEED_LOGGED = "1";
  console.log(`[vitest] tests run in random order, seed ${shuffleSeed} (replay with VITEST_SEED=${shuffleSeed})`);
}

const sharedTest = {
  environment: "jsdom",
  globals: true,
  setupFiles: ["./src/test/setup.ts"],
  // A test that never asserts passes whatever the code does. Making it a
  // failure means an empty or half-written test cannot sit in the suite looking
  // green.
  expect: { requireAssertions: true },
  // Tests run in a random order on CI. Three files only passed in the order
  // they were written, because an earlier test left a counter or a cache
  // behind. The seed is printed below, so a red run replays with
  // VITEST_SEED=<n> pnpm test.
  sequence: { seed: shuffleSeed, shuffle: { files: false, tests: shuffleTests } },
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/lib/**", "src/hooks/**"],
    },
    projects: [
      {
        extends: true,
        test: {
          ...sharedTest,
          name: "unit",
          // `scripts/` is in here because the bundle-size guard's parsing and
          // comparison logic is worth testing and lives beside the script that
          // uses it. Without this glob a test file there is silently never run,
          // which is worse than not having written it.
          include: [
            "src/**/*.{test,spec}.{ts,tsx}",
            "scripts/**/*.{test,spec}.ts",
            // Playwright owns e2e/**/*.spec.ts; plain .test.ts files there
            // cover the setup code around it.
            "e2e/**/*.test.ts",
          ],
          exclude: ["**/node_modules/**", integrationGlob, svelteGlob],
        },
      },
      {
        plugins: [svelte()],
        resolve: {
          alias: { "@": path.resolve(__dirname, "./src") },
          conditions: ["browser"],
        },
        test: {
          ...sharedTest,
          name: "svelte",
          include: [svelteGlob],
        },
      },
      {
        extends: true,
        test: {
          ...sharedTest,
          name: "integration",
          include: [integrationGlob],
        },
      },
    ],
  },
});
