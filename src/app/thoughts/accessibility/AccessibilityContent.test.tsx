import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@/components/PageHeader", () => ({
  default: () => null,
}));

import AccessibilityContent from "./AccessibilityContent";

describe("the accessibility write-up", () => {
  it("owns the violation I introduced myself", () => {
    render(<AccessibilityContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/I had invented a worse version of a\s+solved problem/);
  });

  it("says the shared-library violation was fixed, not just found", () => {
    render(<AccessibilityContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/That one is fixed upstream now, in both framework packages/);
    expect(body).toMatch(
      /the first consumer to look properly finds it for everyone/,
    );
  });

  it("explains why a contrast scan needs a pinned theme", () => {
    render(<AccessibilityContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/races that, and sometimes measures muted text against the other/);
    expect(body).toMatch(/real-looking, unreproducible, and not a bug/);
  });

  it("records the scan that silently stopped running", () => {
    render(<AccessibilityContent />);
    const body = document.body.textContent ?? "";
    // The point of the section: a timeout reads as a slow test, and it is easy
    // to miss that it also means the assertion never ran.
    expect(body).toMatch(/Two of them had never been scanned at all/);
    expect(body).toMatch(/A timeout reads as a slow test/);
  });

  it("names the real violations that were shipping behind it", () => {
    render(<AccessibilityContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/white text at 40% opacity/);
    expect(body).toMatch(/serious-impact colour-contrast failures/);
  });

  it("explains why fonts have to settle before a contrast scan", () => {
    render(<AccessibilityContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(
      /fonts change computed colours, and\s*axe's contrast rule reads computed colours/,
    );
  });

  it("is honest that a green suite is a claim, not proof", () => {
    render(<AccessibilityContent />);
    // Rendered through &ldquo;/&rdquo;, so match the curly quotes the page
    // actually produces rather than the ones in the source.
    expect(document.body.textContent ?? "").toMatch(
      /a report saying \u201cclean\u201d about pages it had quietly stopped looking at/,
    );
  });
});
