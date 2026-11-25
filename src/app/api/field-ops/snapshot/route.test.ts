import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("GET /api/field-ops/snapshot", () => {
  it("returns the current tracks and alerts as JSON", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.tracks.length).toBeGreaterThan(0);
    expect(Array.isArray(body.alerts)).toBe(true);
    expect(typeof body.serverTimeMs).toBe("number");
  });
});
