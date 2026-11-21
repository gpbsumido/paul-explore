import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { queryErrorMessage } from "../queryErrorMessage";
import { CONNECTION_ERROR_MESSAGE } from "@/lib/userFacingError";

describe("queryErrorMessage", () => {
  it("is null when the query isn't in an error state", () => {
    expect(queryErrorMessage(false, new Error("boom"), "Failed to load.")).toBeNull();
  });

  it("returns a message somebody wrote", () => {
    expect(queryErrorMessage(true, new Error("Failed to fetch calendars"), "Failed to load.")).toBe(
      "Failed to fetch calendars",
    );
  });

  it("never returns a schema failure's raw JSON", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const failure = z.object({ id: z.string() }).safeParse({}).error;
    if (!failure) throw new Error("the response should have failed its schema");

    expect(queryErrorMessage(true, failure, "Failed to load.")).toBe("Failed to load.");
  });

  it("falls back for something thrown that is not an Error", () => {
    expect(queryErrorMessage(true, "just a string", "Failed to load.")).toBe(
      "Failed to load.",
    );
  });

  it("falls back for an Error with no message", () => {
    expect(queryErrorMessage(true, new Error(""), "Failed to load.")).toBe(
      "Failed to load.",
    );
  });

  it("says the server could not be reached when the request itself failed", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(queryErrorMessage(true, new TypeError("Failed to fetch"), "Failed to load.")).toBe(
      CONNECTION_ERROR_MESSAGE,
    );
  });
});
