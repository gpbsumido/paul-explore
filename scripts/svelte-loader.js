/**
 * Minimal webpack-style loader that compiles a .svelte file to client-side
 * JavaScript. Next's bundlers (Turbopack and webpack) don't know the format,
 * and Svelte 5's compiler already understands <script lang="ts">, so no
 * preprocessor or extra loader package is needed. Components here have no
 * <style> block (Tailwind classes only), so there is no CSS to hand back.
 */
// Loaders are CommonJS; Next calls them with `require`, not `import`.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { compile } = require("svelte/compiler");

module.exports = function svelteLoader(source) {
  const { js, warnings } = compile(source, {
    filename: this.resourcePath,
    generate: "client",
    dev: this.mode !== "production",
  });
  for (const w of warnings) this.emitWarning(new Error(w.message));
  return js.code;
};
