import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Home from "./page";
import LandingContentV5 from "./v5/LandingContentV5";

/**
 * The root page is static for everyone.
 *
 * The Messenger auth bug happened because / rendered session-dependent HTML
 * (the signed-in hub) and that HTML got cached at the edge. The fix for years
 * was force-dynamic, which traded the leak for a serverless render on every
 * visit — the TTFB floor under the landing's LCP and FCP.
 *
 * The stronger fix: / renders no session-derived markup at all. The only
 * auth-dependent UI (the header CTA) resolves client-side, so there is nothing
 * for a shared cache to leak. These tests pin both halves of that contract.
 */
describe("the root page", () => {
  it("renders the guest landing with a tagline and writing picks", () => {
    const element = Home();

    expect(element.type).toBe(LandingContentV5);
    expect(typeof element.props.taglineIndex).toBe("number");
    expect(Array.isArray(element.props.writingPicks)).toBe(true);
  });

  it("never reads the session and never opts out of static rendering", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "app", "page.tsx"),
      "utf8",
    );

    // No session read: nothing here can vary by who is asking, so the edge
    // cache cannot hold anyone's logged-in page.
    expect(source).not.toMatch(/getSession|auth0|FeatureHub/);
    // And nothing re-introduces the per-visit render the old fix needed.
    expect(source).not.toMatch(/force-dynamic/);
    // ISR keeps the baked tagline rotating.
    expect(source).toMatch(/export\s+const\s+revalidate/);
  });
});
