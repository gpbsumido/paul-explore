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

  it("sends the values in the form, with the amount as a number, to the proxy as a POST", async () => {
    const user = userEvent.setup();
    const spy = stubFetch(200, scoreResponse());
    render(<RiskScoringDemo />);

    await user.clear(screen.getByLabelText(/amount/i));
    await user.type(screen.getByLabelText(/amount/i), "120.5");
    await user.clear(screen.getByLabelText(/user/i));
    await user.type(screen.getByLabelText(/user/i), "u-42");
    await user.clear(screen.getByLabelText(/device/i));
    await user.type(screen.getByLabelText(/device/i), "d-7");
    await user.clear(screen.getByLabelText(/country/i));
    await user.type(screen.getByLabelText(/country/i), "GB");
    await user.click(screen.getByRole("button", { name: /score/i }));

    await screen.findByText(/amber/i);
    const [, init] = spy.mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({
      user_id: "u-42",
      device_id: "d-7",
      amount: 120.5,
      currency: "USD",
      country: "GB",
    });
  });

  it("says it could not reach the proxy when the request itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    render(<RiskScoringDemo />);

    await submitDefaults();

    expect(await screen.findByText(/could not reach the proxy/i)).toBeInTheDocument();
  });

  it("still says something when the backend fails without giving a reason", async () => {
    stubFetch(500, {});
    render(<RiskScoringDemo />);

    await submitDefaults();

    expect(await screen.findByText(/scoring failed, no reason given/i)).toBeInTheDocument();
  });

  it("holds the button while a score is on its way, then shows the result", async () => {
    let finish: (response: Response) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(new Promise<Response>((resolve) => (finish = resolve))),
    );
    render(<RiskScoringDemo />);

    await submitDefaults();
    expect(screen.getByRole("button", { name: /scoring/i })).toBeDisabled();

    finish(
      new Response(JSON.stringify(scoreResponse({ band: "red", value: 90 })), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(await screen.findByText(/red/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /score this transaction/i })).toBeEnabled();
  });
});

