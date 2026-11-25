"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import {
  acknowledgeAlert,
  applyUpdate,
  emptyFeedState,
  type FeedState,
} from "@/lib/field-ops/feedState";
import type { FieldOpsSnapshot } from "@/lib/field-ops/sim";

export type FieldOpsConnection = "live" | "reconnecting" | "offline";

export type FieldOpsFeed = {
  connection: FieldOpsConnection;
  state: FeedState;
  /** Server clock, carried forward by the local one between updates. */
  nowMs: number;
  secondsSinceLastUpdate: number;
  isLowBandwidth: boolean;
  setLowBandwidth: (isLowBandwidth: boolean) => void;
  acknowledge: (alertId: string) => void;
};

const CLOCK_TICK_MS = 1_000;
const OFFLINE_AFTER_SILENT_SECONDS = 15;

type FeedAction =
  | { type: "update"; snapshot: FieldOpsSnapshot; receivedAtMs: number }
  | { type: "acknowledge"; alertId: string }
  | { type: "stream-opened" }
  | { type: "stream-errored" };

type FeedModel = {
  state: FeedState;
  serverTimeMs: number;
  receivedAtMs: number;
  isStreamOpen: boolean;
};

function reduceFeed(model: FeedModel, action: FeedAction): FeedModel {
  switch (action.type) {
    case "update":
      return {
        ...model,
        state: applyUpdate(model.state, action.snapshot),
        serverTimeMs: action.snapshot.serverTimeMs,
        receivedAtMs: action.receivedAtMs,
        isStreamOpen: true,
      };
    case "acknowledge":
      return { ...model, state: acknowledgeAlert(model.state, action.alertId) };
    case "stream-opened":
      return { ...model, isStreamOpen: true };
    case "stream-errored":
      return { ...model, isStreamOpen: false };
  }
}

/**
 * Subscribes to /api/field-ops/stream and keeps the picture. EventSource
 * reconnects by itself, so the hook only has to tell the truth about it: live,
 * reconnecting, or offline once nothing has arrived for a while. Switching low
 * bandwidth on reopens the stream at the slower rate.
 */
export function useFieldOpsFeed(): FieldOpsFeed {
  const [isLowBandwidth, setLowBandwidth] = useState(false);
  const [clockMs, setClockMs] = useState(() => Date.now());
  const [model, dispatch] = useReducer(reduceFeed, undefined, () => ({
    state: emptyFeedState,
    serverTimeMs: 0,
    receivedAtMs: 0,
    isStreamOpen: false,
  }));

  useEffect(() => {
    const clockTimer = setInterval(() => setClockMs(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    const source = new EventSource(`/api/field-ops/stream${isLowBandwidth ? "?rate=low" : ""}`);
    source.onopen = () => dispatch({ type: "stream-opened" });
    source.onerror = () => dispatch({ type: "stream-errored" });
    source.addEventListener("update", (event) => {
      const snapshot: FieldOpsSnapshot = JSON.parse((event as MessageEvent<string>).data);
      dispatch({ type: "update", snapshot, receivedAtMs: Date.now() });
    });
    return () => source.close();
  }, [isLowBandwidth]);

  const acknowledge = useCallback(
    (alertId: string) => dispatch({ type: "acknowledge", alertId }),
    [],
  );

  const hasReceivedAnything = model.receivedAtMs > 0;
  const secondsSinceLastUpdate = hasReceivedAnything
    ? Math.max(0, Math.round((clockMs - model.receivedAtMs) / 1000))
    : 0;
  const connection: FieldOpsConnection = !hasReceivedAnything
    ? "reconnecting"
    : secondsSinceLastUpdate > OFFLINE_AFTER_SILENT_SECONDS
      ? "offline"
      : model.isStreamOpen
        ? "live"
        : "reconnecting";

  return {
    connection,
    state: model.state,
    nowMs: hasReceivedAnything ? model.serverTimeMs + (clockMs - model.receivedAtMs) : 0,
    secondsSinceLastUpdate,
    isLowBandwidth,
    setLowBandwidth,
    acknowledge,
  };
}
