import { describe, it, expect, vi, afterEach } from "vitest";
import { z } from "zod";
import { userFacingErrorMessage, CONNECTION_ERROR_MESSAGE } from "./userFacingError";

const FALLBACK = "Couldn't save the calendar. Please try again.";

/** A real ZodError, the way a response that fails its schema throws one. */
function zodErrorFor(response: unknown): z.ZodError {
  const result = z
    .object({ role: z.enum(["owner", "editor", "viewer"]) })
    .safeParse(response);
  if (result.success) throw new Error("the response should have failed its schema");
  return result.error;
}

afterEach(() => vi.restoreAllMocks());

/**
 * A person should read what happened in plain words. Messages somebody wrote on
 * purpose pass through; anything that is really a developer's diagnostic (a
 * schema failure, a rejected fetch, HTML where JSON was expected) is logged and
 * replaced.
 */
describe("userFacingErrorMessage", () => {
  it("never shows a ZodError's JSON", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const message = userFacingErrorMessage(zodErrorFor({}), FALLBACK);

    expect(message).toBe(FALLBACK);
    expect(message).not.toMatch(/invalid_value|path|\[|\{/);
  });

  it("logs the original error so the detail isn't lost", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const original = zodErrorFor({});

    userFacingErrorMessage(original, FALLBACK);

    expect(log).toHaveBeenCalledWith(expect.anything(), original);
  });

  it.each([
    ["a rejected fetch", new TypeError("Failed to fetch")],
    ["HTML where JSON was expected", new SyntaxError("Unexpected token '<'")],
  ])("logs %s so the detail isn't lost", (_label, original) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    userFacingErrorMessage(original, FALLBACK);

    expect(log).toHaveBeenCalledWith(expect.anything(), original);
  });

  it("reads a rejected fetch as a connection problem", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(userFacingErrorMessage(new TypeError("Failed to fetch"), FALLBACK)).toBe(
      CONNECTION_ERROR_MESSAGE,
    );
  });

  it("hides HTML where JSON was expected", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const parseFailure = new SyntaxError(`Unexpected token '<', "<!DOCTYPE "... is not valid JSON`);

    expect(userFacingErrorMessage(parseFailure, FALLBACK)).toBe(FALLBACK);
  });

  it("passes through a message somebody wrote for people", () => {
    const message = "You already have an active season wallet";

    expect(userFacingErrorMessage(new Error(message), FALLBACK)).toBe(message);
  });

  it("uses the fallback for an Error with no message", () => {
    expect(userFacingErrorMessage(new Error(""), FALLBACK)).toBe(FALLBACK);
  });

  it.each([
    ["a string", "boom"],
    ["null", null],
    ["undefined", undefined], ["an object", { a: 1 }],
    ["a plain object that only looks like an error", { message: "not an Error" }],
  ])(
    "uses the fallback when %s was thrown",
    (_label, thrown) => {
      expect(userFacingErrorMessage(thrown, FALLBACK)).toBe(FALLBACK);
    },
  );
});
