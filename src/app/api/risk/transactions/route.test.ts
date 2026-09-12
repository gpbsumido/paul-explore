import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

/**
 * The risk demo talks to the Go scoring service through this proxy so the
 * browser never needs the backend's URL or a CORS story. The proxy has three
 * jobs: say clearly when no backend is configured, refuse garbage before it
 * leaves the building, and otherwise pass the backend's answer through intact.
 */

const post = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/risk/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

const validBody = () => ({
  user_id: "user-1",
  device_id: "device-1",
  amount: 42.5,
  currency: "USD",
  country: "CA",
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("risk transactions proxy", () => {
  it("answers 503 with a plain explanation when no backend is configured", async () => {
    vi.stubEnv("RISK_API_URL", "");

    const res = await post(validBody());

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/not configured/i);
  });

  it("rejects a body without the fields the scorer needs, before calling the backend", async () => {
    vi.stubEnv("RISK_API_URL", "http://risk.example");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const res = await post({ user_id: "user-1", amount: -5 });

    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("forwards a valid transaction and returns the backend's score untouched", async () => {
    vi.stubEnv("RISK_API_URL", "http://risk.example");
    const upstream = {
      transaction: { id: "t-1" },
      score: {
        transaction_id: "t-1",
        value: 55,
        band: "amber",
        hits: [{ rule_id: "amount_threshold", reason: "big", weight: 30 }],
      },
    };
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(upstream), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const res = await post(validBody());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(upstream);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe("http://risk.example/v1/transactions");
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject(
      validBody(),
    );
  });

  it("maps an unreachable backend to 502 rather than an unhandled crash", async () => {
    vi.stubEnv("RISK_API_URL", "http://risk.example");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED")),
    );

    const res = await post(validBody());

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/unreachable/i);
  });
});
