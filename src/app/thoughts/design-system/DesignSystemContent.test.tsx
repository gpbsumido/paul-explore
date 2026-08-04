import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

import DesignSystemContent from "./DesignSystemContent";

describe("the design system write-up", () => {
  it("records that a consuming app found the library's accessibility bug", () => {
    render(<DesignSystemContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(
      /the first consumer to look properly finds it\s+for all of them/,
    );
    expect(body).toMatch(/fixed before it ever shipped/);
  });

  it("explains why a caret on a zero-major does not pick up a minor", () => {
    render(<DesignSystemContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/a caret on a\s*0\.x\s*range/);
    expect(body).toMatch(/while appearing to track the package/);
  });

  it("credits the gallery test with catching the undocumented components", () => {
    render(<DesignSystemContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/the job a changelog cannot/);
    expect(body).toMatch(/because claiming otherwise would be the easy lie/);
  });
});
