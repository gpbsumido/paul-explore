import { describe, expect, it } from "vitest";
import { forgiveUnexpectedOutput } from "../unexpectedOutput";

describe("unexpected console output", () => {
  it("records an update that was not wrapped in act, with the component named", () => {
    console.error(
      "An update to %s inside a test was not wrapped in act(...).",
      "Slate",
    );

    expect(forgiveUnexpectedOutput()).toEqual([
      "An update to Slate inside a test was not wrapped in act(...).",
    ]);
  });

  it("records the warning that act itself is not enabled", () => {
    console.error("The current testing environment is not configured to support act(...)");

    expect(forgiveUnexpectedOutput()).toHaveLength(1);
  });
});
