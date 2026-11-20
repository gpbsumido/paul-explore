import { describe, it, expect } from "vitest";
import { NextResponse } from "next/server";
import { withOperatorErrors } from "@/lib/operator-route-errors";
import { InvalidSegmentError } from "@/lib/safeSegment";
import { OperatorApiError, OperatorContractError } from "@/lib/operator-client";

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

  it("reports an API 5xx on a write as a 502 from upstream", async () => {
    const wrapped = withOperatorErrors(async () => {
      throw new OperatorApiError(503);
    });

    const res = await wrapped();

    expect(res.status).toBe(502);
  });

  it("reports an unreadable API answer as a 502 that says the write may have applied", async () => {
    const wrapped = withOperatorErrors(async () => {
      throw new OperatorContractError("/alerts/x/dismiss", new Error("bad shape"));
    });

    const res = await wrapped();

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: expect.stringMatching(/may have/i) });
  });
});
