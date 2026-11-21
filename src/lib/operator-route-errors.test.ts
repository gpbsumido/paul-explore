import { describe, it, expect, vi, afterEach } from "vitest";
import { NextResponse } from "next/server";
import {
  OperatorServiceTokenError,
  OperatorUnavailableError,
  withOperatorErrors,
} from "@/lib/operator-route-errors";
import { InvalidSegmentError } from "@/lib/safeSegment";
import { OperatorApiError, OperatorContractError } from "@/lib/operator-client";

afterEach(() => vi.restoreAllMocks());

describe("withOperatorErrors", () => {
  it("maps a thrown InvalidSegmentError to a clean 400, not a 5xx outage", async () => {
    const wrapped = withOperatorErrors(async () => {
      throw new InvalidSegmentError("path separator in segment");
    });

    const res = await wrapped();

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid identifier" });
  });

  it("still returns the handler's response when nothing is thrown", async () => {
    const wrapped = withOperatorErrors(async () =>
      NextResponse.json({ ok: true }),
    );

    const res = await wrapped();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it.each([400, 404, 409, 422])("passes an API %i on a write straight through", async (status) => {
    const wrapped = withOperatorErrors(async () => {
      throw new OperatorApiError(status);
    });

    const res = await wrapped();

    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({ error: expect.stringContaining(String(status)) });
  });

  it.each([500, 503])("reports an API %i on a write as a 502 from upstream", async (status) => {
    const wrapped = withOperatorErrors(async () => {
      throw new OperatorApiError(status);
    });

    const res = await wrapped();

    expect(res.status).toBe(502);
  });

  it("says what to fix when the service token is rejected, and flags it in a header", async () => {
    const wrapped = withOperatorErrors(async () => {
      throw new OperatorServiceTokenError(401);
    });

    const res = await wrapped();

    expect(res.status).toBe(503);
    expect(res.headers.get("x-operator-config")).toBe("token-mismatch");
    expect(await res.json()).toEqual({ error: expect.stringContaining("OPERATOR_SERVICE_TOKEN") });
  });

  it("answers 503 rather than an empty 200 when the seed has nothing for a store", async () => {
    const wrapped = withOperatorErrors(async () => {
      throw new OperatorUnavailableError("sales");
    });

    const res = await wrapped();

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: expect.stringContaining("Could not load sales") });
  });

  it("lets an error it doesn't know about reach the caller", async () => {
    const wrapped = withOperatorErrors(async () => {
      throw new RangeError("a bug in the handler");
    });

    await expect(wrapped()).rejects.toThrow("a bug in the handler");
  });

  it("reports an unreadable API answer as a 502 that says the write may have applied", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const wrapped = withOperatorErrors(async () => {
      throw new OperatorContractError("/alerts/x/dismiss", new Error("bad shape"));
    });

    const res = await wrapped();

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: expect.stringMatching(/may have/i) });
    expect(log).toHaveBeenCalled();
  });
});
