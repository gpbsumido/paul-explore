import { describe, it, expect } from "vitest";
import { evarRedirects } from "./evarRedirects";

/**
 * Follows a path through the redirects the way Next matches them: first rule
 * wins, `:path*` takes the rest of the path.
 */
const follow = (path: string) => {
  for (const rule of evarRedirects()) {
    const prefix = rule.source.replace("/:path*", "");
    const exact = rule.source === path;
    const rest = rule.source.endsWith("/:path*") && path.startsWith(`${prefix}/`) ? path.slice(prefix.length + 1) : null;
    if (exact) return { to: rule.destination, permanent: rule.permanent };
    if (rest !== null) return { to: rule.destination.replace(":path*", rest), permanent: rule.permanent };
  }
  return null;
};

describe("evarRedirects", () => {
  it("sends /evar to the practice on its own domain", () => {
    expect(follow("/evar")).toEqual({ to: "https://medical.paulsumido.com/practice", permanent: true });
  });

  it("sends the old welcome page to the new homepage", () => {
    expect(follow("/evar/welcome")).toEqual({ to: "https://medical.paulsumido.com/", permanent: true });
  });

  it("keeps the rest of the path for every other page", () => {
    expect(
      ["/evar/guide", "/evar/plan", "/evar/results", "/evar/admin", "/evar/admin/results"].map((p) => follow(p)?.to),
    ).toEqual([
      "https://medical.paulsumido.com/guide",
      "https://medical.paulsumido.com/plan",
      "https://medical.paulsumido.com/results",
      "https://medical.paulsumido.com/admin",
      "https://medical.paulsumido.com/admin/results",
    ]);
  });

  it("leaves the write-up and lookalike paths alone", () => {
    expect(follow("/thoughts/evar-sizing")).toBeNull();
    expect(follow("/evarx")).toBeNull();
  });
});
