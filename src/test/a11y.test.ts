import { describe, it, expect } from "vitest";
import { axe } from "./a11y";

describe("a11y test helper", () => {
  it("reports no violations for accessible markup", async () => {
    const container = document.createElement("div");
    container.innerHTML = '<button type="button">Click me</button>';
    document.body.appendChild(container);

    const results = await axe(container);
    expect(results).toHaveNoViolations();

    document.body.removeChild(container);
  });

  it("detects violations in inaccessible markup", async () => {
    const container = document.createElement("div");
    container.innerHTML = "<img />";
    document.body.appendChild(container);

    const results = await axe(container);
    expect(results.violations.length).toBeGreaterThan(0);

    document.body.removeChild(container);
  });
});
