import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RiskScoringDemo from "./RiskScoringDemo";

/**
 * The demo exists so a reader can poke the real scoring service from the
 * write-up: fill in a transaction, get back a band and the reasons. When the
 * backend isn't deployed or configured, the demo has to say so instead of
 * looking broken.
 */

const scoreResponse = (over: Partial<Record<string, unknown>> = {}) => ({
  transaction: { id: "t-1" },
  score: {
    transaction_id: "t-1",
    value: 55,
    band: "amber",
    hits: [
      {
        rule_id: "amount_threshold",
        reason: "amount 6000.00 exceeds limit 5000.00",
        weight: 30,
      },
    ],
    ...over,
  },
});

const stubFetch = (status: number, body: unknown) => {
  const spy = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", spy);
  return spy;
};

const submitDefaults = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /score/i }));
  return user;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RiskScoringDemo", () => {
  it("offers the fields the rules actually read: amount, user, device, country", () => {
    render(<RiskScoringDemo />);

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/user/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/device/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
  });

  it("scores a transaction through the proxy and shows the band, the number, and every reason", async () => {
    const spy = stubFetch(200, scoreResponse());
    render(<RiskScoringDemo />);

    await submitDefaults();

    expect(await screen.findByText(/amber/i)).toBeInTheDocument();
    expect(screen.getByText(/55/)).toBeInTheDocument();
    expect(
      screen.getByText(/amount 6000\.00 exceeds limit 5000\.00/),
    ).toBeInTheDocument();
    const [url] = spy.mock.calls[0];
    expect(String(url)).toBe("/api/risk/transactions");
  });

  it("says a green transaction tripped nothing rather than showing an empty list", async () => {
    stubFetch(200, scoreResponse({ value: 0, band: "green", hits: [] }));
    render(<RiskScoringDemo />);

    await submitDefaults();

    expect(await screen.findByText(/green/i)).toBeInTheDocument();
    expect(screen.getByText(/no rules fired/i)).toBeInTheDocument();
  });

  it("treats a backend that sends hits as null like an empty hit list instead of crashing", async () => {
    stubFetch(200, scoreResponse({ value: 0, band: "green", hits: null }));
    render(<RiskScoringDemo />);

    await submitDefaults();

    expect(await screen.findByText(/green/i)).toBeInTheDocument();
    expect(screen.getByText(/no rules fired/i)).toBeInTheDocument();
  });

  it("surfaces the backend-not-configured answer instead of looking broken", async () => {
    stubFetch(503, { error: "RISK_API_URL is not configured" });
    render(<RiskScoringDemo />);

    await submitDefaults();

    expect(
      await screen.findByText(/RISK_API_URL is not configured/i),
    ).toBeInTheDocument();
  });
});
