/**
 * What the site is built on, for the rail under the landing's figures: the
 * runtime it ships on, then the test stack. Supporting libraries stay off it so
 * the rail reads as the stack, not a dependency dump.
 *
 * Each label is written for people, and each `pkg` is the dependency that
 * backs it. `stack.test.tsx` fails if a package here isn't in package.json, so
 * pulling something out of the repo means pulling it off the page too.
 */
export const STACK = [
  { pkg: "next", label: "Next.js" },
  { pkg: "react", label: "React" },
  { pkg: "typescript", label: "TypeScript" },
  { pkg: "@tanstack/react-query", label: "TanStack Query" },
  { pkg: "zod", label: "Zod" },
  { pkg: "tailwindcss", label: "Tailwind CSS" },
  { pkg: "three", label: "Three.js" },
  { pkg: "svelte", label: "Svelte" },
  { pkg: "@module-federation/runtime", label: "Module Federation" },
  { pkg: "ably", label: "Ably" },
  { pkg: "@auth0/nextjs-auth0", label: "Auth0" },
  { pkg: "vitest", label: "Vitest" },
  { pkg: "@playwright/test", label: "Playwright" },
  { pkg: "@stryker-mutator/core", label: "Stryker" },
];
