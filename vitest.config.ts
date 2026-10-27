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

const sharedTest = {
  environment: "jsdom",
  globals: true,
  setupFiles: ["./src/test/setup.ts"],
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
