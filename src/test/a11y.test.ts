import { afterEach, describe, it, expect } from "vitest";
import { axe } from "./a11y";

/** Mounts markup on the page, since axe needs it attached to the document. */
function mount(markup: string): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = markup;
  document.body.appendChild(container);
  return container;
}

// Clean up even when an assertion throws, so one failure doesn't smear markup
// into the next test's page.
afterEach(() => {
  document.body.innerHTML = "";
});

describe("a11y test helper", () => {
  it("reports no violations for accessible markup", async () => {
    const results = await axe(mount('<button type="button">Click me</button>'));
    expect(results).toHaveNoViolations();
  });

  it("detects a missing image alternative in inaccessible markup", async () => {
    const results = await axe(mount("<img />"));
    expect(results.violations.map((violation) => violation.id)).toContain("image-alt");
  });

  it("only holds markup to WCAG, not to best-practice rules", async () => {
    // Skipping from h1 to h3 trips axe's heading-order rule, which is tagged
    // best-practice rather than WCAG. If the helper ever runs every rule, this
    // starts failing, and so would every component test that renders a heading.
    const results = await axe(mount("<main><h1>Title</h1><h3>Skipped a level</h3></main>"));
    expect(results).toHaveNoViolations();
  });
});
