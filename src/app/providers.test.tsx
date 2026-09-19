import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The design-system Toaster portals to document.body on its first client render.
 * Imported statically it renders during SSR/hydration, so the server tree (no
 * portal yet) and the first client tree (portal) disagree -- a hydration error
 * that showed up on the old homepage too. It has to load client-only so the
 * portal is created after hydration rather than during it. This pins that so a
 * future edit can't quietly turn it back into a static import.
 */
describe("app providers", () => {
  const source = readFileSync(
    join(process.cwd(), "src", "app", "providers.tsx"),
    "utf-8",
  );

  it("mounts the toaster client-only so its portal can't break hydration", () => {
    // No static import — that would render (and portal) during hydration.
    expect(source).not.toMatch(
      /import\s*\{[^}]*\bToaster\b[^}]*\}\s*from\s*["']@paul-portfolio\/react["']/,
    );
    // Loaded through a dynamic import with server rendering off.
    expect(source).toMatch(/Toaster\s*=\s*dynamic\([\s\S]*?ssr:\s*false/);
  });
});
