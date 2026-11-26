"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import {
  acknowledgeAlert,
  applyUpdate,
  emptyFeedState,
  type FeedState,
} from "@/lib/field-ops/feedState";
import { API_URL } from "@/lib/apiUrl";
import type { FieldOpsSnapshot } from "@/lib/field-ops/types";

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
const FIRST_RETRY_DELAY_MS = 1_000;
const LONGEST_RETRY_DELAY_MS = 10_000;
const SOCKET_URL = `${API_URL.replace(/^http/, "ws")}/api/field-ops/socket`;

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
 * Subscribes to portfolio_api's field ops socket and keeps the picture. When
 * the socket drops it reconnects with a growing delay and asks for everything
 * since the last sequence it saw, so the server replays what was missed. The
 * hook only has to tell the truth about it: live, reconnecting, or offline once
 * nothing has arrived for a while. Switching low bandwidth on reopens the
 * socket at the slower rate.
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
    let lastSequence = 0;
    let failedAttempts = 0;
    let isClosedByUs = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let socket: WebSocket;

    const connect = () => {
      const query = new URLSearchParams();
      if (isLowBandwidth) query.set("rate", "low");
      if (lastSequence > 0) query.set("since", String(lastSequence));
      const queryString = query.toString();
      socket = new WebSocket(queryString ? `${SOCKET_URL}?${queryString}` : SOCKET_URL);
      socket.onopen = () => {
        failedAttempts = 0;
        dispatch({ type: "stream-opened" });
      };
      socket.onmessage = (event) => {
        const frame: { sequence: number; snapshot: FieldOpsSnapshot } = JSON.parse(event.data);
        lastSequence = frame.sequence;
        dispatch({ type: "update", snapshot: frame.snapshot, receivedAtMs: Date.now() });
      };
      socket.onclose = () => {
        if (isClosedByUs) return;
        dispatch({ type: "stream-errored" });
        const delayMs = Math.min(FIRST_RETRY_DELAY_MS * 2 ** failedAttempts, LONGEST_RETRY_DELAY_MS);
        failedAttempts += 1;
        retryTimer = setTimeout(connect, delayMs);
      };
    };

    connect();
    return () => {
      isClosedByUs = true;
      clearTimeout(retryTimer);
      socket.close();
    };
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
