import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

import TestingContent from "./TestingContent";

describe("the testing write-up", () => {
  it("records the suite that no pipeline was running", () => {
    render(<TestingContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(
      /every\s+one\s+of\s+them\s+was\s+green\s+because\s+I\s+had\s+remembered\s+to\s+run\s+it/,
    );
    expect(body).toMatch(/A\s+suite\s+nothing\s+runs\s+is\s+documentation/);
  });

  it("records the count that changed depending on whether you had built", () => {
    render(<TestingContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/doubled\s+after\s+a\s+build/);
  });
});
