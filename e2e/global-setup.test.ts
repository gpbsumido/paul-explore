// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "fs";
import type { APIRequestContext, FullConfig } from "@playwright/test";
import globalSetup, {
  AUTH_FILE,
  PUBLIC_STATE_FILE,
  createTestCalendar,
  STATE_FILE,
} from "./global-setup";

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

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

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

describe("globalSetup without credentials", () => {
  /**
   * Both Playwright projects point at a storageState file, so setup has to
   * leave a valid one behind even when there is no login to run. Each one
   * carries the accepted-consent cookie so no test fights the banner.
   */
  it("writes a consent-only storageState for both projects when there are no credentials", async () => {
    vi.stubEnv("E2E_TEST_EMAIL", "");
    vi.stubEnv("E2E_TEST_PASSWORD", "");
    vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
    vi.spyOn(console, "log").mockImplementation(() => {});
    const written = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

    // The config goes unused by setup, so an empty stand-in is enough.
    await globalSetup({} as FullConfig);

    const stateByFile = new Map(
      written.mock.calls.map(([file, contents]) => [file, JSON.parse(String(contents))]),
    );
    for (const file of [PUBLIC_STATE_FILE, AUTH_FILE]) {
      expect(stateByFile.get(file)).toMatchObject({
        cookies: [{ name: "cookie_consent", value: "accepted" }],
        origins: [],
      });
    }
    expect(stateByFile.has(STATE_FILE)).toBe(false);
  });
});
