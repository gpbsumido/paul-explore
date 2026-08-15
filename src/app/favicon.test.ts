import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The tab icon has to be mine, and it has to be the file the browser actually
 * asks for.
 *
 * `icon.tsx` renders the "P" and Next links it, which is why local tabs looked
 * right. Browsers still request `/favicon.ico` on their own, and that route is
 * served by `src/app/favicon.ico` — which was create-next-app's Vercel triangle,
 * committed at initialization and never replaced. So every deployed tab showed
 * someone else's logo while the generated icon sat unused beside it.
 *
 * Hashing the known default is the check that would have caught it. Size alone
 * would not: a wrong icon can be any size, and the whole failure was that
 * nobody thought to open the file.
 */
const FAVICON = join(process.cwd(), "src/app/favicon.ico");

/** sha256 of the favicon.ico create-next-app ships. */
const VERCEL_DEFAULT =
  "2b8ad2d33455a8f736fc3a8ebf8f0bdea8848ad4c0db48a2833bd0f9cd775932";

const favicon = (): Buffer => readFileSync(FAVICON);

describe("favicon.ico", () => {
  it("is not the framework's default icon", () => {
    const hash = createHash("sha256").update(favicon()).digest("hex");
    expect(hash).not.toBe(VERCEL_DEFAULT);
  });

  it("is a real ICO container", () => {
    const bytes = favicon();
    // ICONDIR: reserved 0, type 1 (icon), then the image count.
    expect(bytes.readUInt16LE(0)).toBe(0);
    expect(bytes.readUInt16LE(2)).toBe(1);
    expect(bytes.readUInt16LE(4)).toBeGreaterThan(0);
  });

  it("carries the sizes a tab actually renders", () => {
    const bytes = favicon();
    const count = bytes.readUInt16LE(4);
    const sizes = Array.from({ length: count }, (_, i) =>
      bytes.readUInt8(6 + i * 16),
    );
    expect(sizes).toContain(16);
    expect(sizes).toContain(32);
  });

  it("stays small enough to be worth shipping in every request", () => {
    expect(favicon().byteLength).toBeLessThan(10 * 1024);
  });
});
