import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { queryErrorMessage } from "../queryErrorMessage";

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
});
