import { defineConfig } from "vitest/config";
import path from "path";

// Stryker's own Vitest config. Its `related` mode walks the whole unit
// project's import graph, and since the Svelte project landed that graph
// reaches MindReader.svelte through MindReaderContent's dynamic import, which
// a React-only project can't parse. Every mutated file is NFL math, so the
// NFL tests are the only ones that can kill a mutant anyway.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/lib/nfl/**/*.test.ts"],
  },
});
