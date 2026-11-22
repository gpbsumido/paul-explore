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

  it("records a warning as well as an error, and only the first line of a long one", () => {
    console.warn("Encountered two children with the same key, `5`.\n    at Grid");

    expect(forgiveUnexpectedOutput()).toEqual([
      "Encountered two children with the same key, `5`.",
    ]);
  });

  it("hands the output over once, so the next test starts clean", () => {
    console.error("first");
    forgiveUnexpectedOutput();

    expect(forgiveUnexpectedOutput()).toEqual([]);
  });
});
