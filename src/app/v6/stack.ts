/**
 * What the site is built on, for the strip under the landing's figures.
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
  { pkg: "framer-motion", label: "Framer Motion" },
  { pkg: "three", label: "Three.js" },
  { pkg: "@react-three/fiber", label: "React Three Fiber" },
  { pkg: "svelte", label: "Svelte" },
  { pkg: "@module-federation/runtime", label: "Module Federation" },
  { pkg: "ably", label: "Ably" },
  { pkg: "@auth0/nextjs-auth0", label: "Auth0" },
  { pkg: "recharts", label: "Recharts" },
  { pkg: "vitest", label: "Vitest" },
  { pkg: "@testing-library/react", label: "Testing Library" },
  { pkg: "msw", label: "MSW" },
  { pkg: "@playwright/test", label: "Playwright" },
  { pkg: "@stryker-mutator/core", label: "Stryker" },
];
