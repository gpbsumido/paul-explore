import { describe, it, expect } from "vitest";
import { NextResponse } from "next/server";
import { withOperatorErrors } from "@/lib/operator-route-errors";
import { InvalidSegmentError } from "@/lib/safeSegment";

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
});
