// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "fs";
import type { APIRequestContext } from "@playwright/test";
import { createTestCalendar, STATE_FILE } from "./global-setup";

/**
 * When setup couldn't create the test calendar it logged a warning and moved
 * on, and the calendar specs skipped themselves for want of an id. With
 * credentials set, that's a broken run reported as a green one.
 */
const requestReturning = (status: number, body: unknown) =>
  ({
    post: vi.fn(async () => ({
      ok: () => status >= 200 && status < 300,
      status: () => status,
      text: async () => JSON.stringify(body),
      json: async () => body,
    })),
  }) as unknown as APIRequestContext;

afterEach(() => vi.restoreAllMocks());

describe("createTestCalendar", () => {
  it("fails setup, with the status and body, when the API rejects the create", async () => {
    const written = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

    await expect(
      createTestCalendar(requestReturning(500, { error: "db down" })),
    ).rejects.toThrow(/500.*db down/);
    expect(written).not.toHaveBeenCalled();
  });

  it("records the calendar id for the specs when the create works", async () => {
    const written = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

    await createTestCalendar(requestReturning(201, { calendar: { id: "cal-1" } }));

    expect(written).toHaveBeenCalledWith(
      STATE_FILE,
      JSON.stringify({ calendarId: "cal-1" }),
    );
  });
});
