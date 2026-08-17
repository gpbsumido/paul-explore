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

  it("withdraws the claim that the visual gap was closed", () => {
    render(<DesignSystemContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/had\s+been\s+comparing\s+nothing\s+for\s+about\s+a\s+month/);
    expect(body).toMatch(/I\s+recorded\s+that\s+gap\s+as\s+closed\s+and\s+it\s+was\s+not/);
  });

  it("credits the gallery test with catching the undocumented components", () => {
    render(<DesignSystemContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/the job a changelog cannot/);
    expect(body).toMatch(/because claiming otherwise would be the easy lie/);
  });
});
