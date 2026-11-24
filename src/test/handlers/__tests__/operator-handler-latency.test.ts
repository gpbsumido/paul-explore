import { afterEach, describe, expect, it, vi } from "vitest";
import { API_URL } from "@/lib/apiUrl";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("operator handler latency", () => {
  it("never rolls a random delay, so a test cannot race one", async () => {
    // MSW rolls Math.random itself to id each request, so only the rolls that
    // start inside the operator handlers count.
    const rollsFromHandlers: string[] = [];
    vi.spyOn(Math, "random").mockImplementation(() => {
      const stack = new Error().stack ?? "";
      if (stack.includes("/src/test/handlers/operator.ts")) rollsFromHandlers.push(stack);
      return 0.5;
    });

    await fetch(`${API_URL}/api/operator/fleet-summary`);
    await fetch(`${API_URL}/api/operator/stores`);

    expect(rollsFromHandlers).toEqual([]);
  });
});
