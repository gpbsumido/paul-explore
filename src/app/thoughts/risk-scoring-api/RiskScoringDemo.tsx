"use client";

import { useState } from "react";

/**
 * Live demo against the Go risk-scoring service, routed through
 * /api/risk/transactions so the browser stays same-origin. Fill in a
 * transaction, get back the score, its band, and every rule that fired.
 */

type RuleHit = {
  rule_id: string;
  reason: string;
  weight: number;
};

type Score = {
  transaction_id: string;
  value: number;
  band: "green" | "amber" | "red";
  hits: RuleHit[];
};

type DemoState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "scored"; score: Score }
  | { kind: "error"; message: string };

const BAND_STYLES: Record<Score["band"], string> = {
  green: "bg-success-500/15 text-success-700 dark:text-success-300",
  amber: "bg-warning-500/15 text-warning-700 dark:text-warning-300",
  red: "bg-error-500/15 text-error-700 dark:text-error-300",
};

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500";
const labelClass = "block text-xs font-semibold text-muted";

export default function RiskScoringDemo() {
  const [amount, setAmount] = useState("6000");
  const [userId, setUserId] = useState("demo-user");
  const [deviceId, setDeviceId] = useState("demo-device");
  const [country, setCountry] = useState("CA");
  const [state, setState] = useState<DemoState>({ kind: "idle" });

  const score = async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/risk/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          device_id: deviceId,
          amount: Number(amount),
          currency: "USD",
          country,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({
          kind: "error",
          message:
            typeof data?.error === "string"
              ? data.error
              : "scoring failed, no reason given",
        });
        return;
      }
      setState({ kind: "scored", score: data.score as Score });
    } catch {
      setState({ kind: "error", message: "could not reach the proxy" });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void score();
        }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <div>
          <label htmlFor="risk-demo-amount" className={labelClass}>
            Amount (USD)
          </label>
          <input
            id="risk-demo-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="risk-demo-user" className={labelClass}>
            User ID
          </label>
          <input
            id="risk-demo-user"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="risk-demo-device" className={labelClass}>
            Device ID
          </label>
          <input
            id="risk-demo-device"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="risk-demo-country" className={labelClass}>
            Country
          </label>
          <input
            id="risk-demo-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={state.kind === "loading"}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
          >
            {state.kind === "loading" ? "Scoring…" : "Score this transaction"}
          </button>
        </div>
      </form>

      {state.kind === "error" && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-error-500/10 p-3 text-sm text-error-700 dark:text-error-300"
        >
          {state.message}
        </p>
      )}

      {state.kind === "scored" && (
        <div className="mt-4 rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${BAND_STYLES[state.score.band]}`}
            >
              {state.score.band}
            </span>
            <span className="text-sm text-muted">
              score{" "}
              <span className="font-mono font-semibold text-foreground">
                {state.score.value}
              </span>{" "}
              / 100
            </span>
          </div>
          {state.score.hits.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No rules fired — this one sails through.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {state.score.hits.map((hit) => (
                <li key={hit.rule_id} className="flex items-baseline gap-2">
                  <span className="shrink-0 rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-muted">
                    +{hit.weight}
                  </span>
                  <span className="text-sm text-muted">
                    <span className="font-mono text-[12px] text-foreground">
                      {hit.rule_id}
                    </span>{" "}
                    — {hit.reason}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
