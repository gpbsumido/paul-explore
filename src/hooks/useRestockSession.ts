"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { queryKeys } from "@/lib/queryKeys";
import {
  restockLineSchema,
  restockSessionSchema,
} from "@/lib/operator-schemas";
import type { RestockLineBody } from "@/lib/operator-restock-types";
import type { RestockLine, RestockSession } from "@/types/operator";
import { userFacingErrorMessage } from "@/lib/userFacingError";

const STORAGE_PREFIX = "operator-restock-session";

/**
 * Prefers the server's own explanation over a generic one.
 *
 * A configuration problem (the service token not matching portfolio_api) is
 * something a person can fix, so saying "try again" wastes their time. The BFF
 * returns 503 with a message naming the variable; that message is worth showing.
 */
async function describeFailure(res: Response, fallback: string): Promise<Error> {
  try {
    const body = (await res.json()) as { error?: string };
    return new Error(body.error ?? fallback);
  } catch {
    return new Error(fallback);
  }
}

function messageFor(err: unknown, fallback: string): string {
  return userFacingErrorMessage(err, fallback);
}

/**
 * Where an in-progress session id is parked so a reload can pick it back up.
 *
 * The session already lives server-side, so surviving a refresh costs one
 * localStorage key. This matters more than it sounds: the target device is a
 * phone in a parking garage or a stairwell, and losing twenty slots of counting
 * to a backgrounded tab would make the whole feature untrustworthy.
 */
function storageKey(storeId: string): string {
  return `${STORAGE_PREFIX}:${storeId}`;
}

export function readStoredSessionId(storeId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(storageKey(storeId));
  } catch {
    return null;
  }
}

function storeSessionId(storeId: string, sessionId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionId === null) {
      window.localStorage.removeItem(storageKey(storeId));
    } else {
      window.localStorage.setItem(storageKey(storeId), sessionId);
    }
  } catch {
    // A private-mode browser that refuses storage should still let someone
    // finish a restock; they just lose resume.
  }
}

/**
 * What came of trying to pick a session back up.
 *
 * "gone" and "failed" are different on purpose. Gone means the server said the
 * session is finished or doesn't exist, so the stored id is dead. Failed means
 * we never got a straight answer (a dropped connection, a 5xx), and the
 * session is probably still sitting there with real counts on it.
 */
export type ResumeOutcome =
  | { kind: "resumed"; session: RestockSession; lines: readonly RestockLine[] }
  | { kind: "gone" }
  | { kind: "failed" };

export type UseRestockSessionReturn = {
  session: RestockSession | null;
  isOpening: boolean;
  isCompleting: boolean;
  error: string | null;
  open: () => Promise<RestockSession | null>;
  resume: (sessionId: string) => Promise<ResumeOutcome>;
  saveLine: (itemId: string, body: RestockLineBody) => Promise<boolean>;
  complete: (notes: string | null) => Promise<boolean>;
  discard: () => void;
};

/**
 * Drives one restock session: open it, push a line per slot as the restocker
 * saves it, then complete.
 *
 * Lines are pushed on slot-save rather than on every tap. Per-keystroke writes
 * over a bad connection is the obvious wrong design, and the local draft is the
 * source of truth until a slot is done.
 */
export function useRestockSession(storeId: string): UseRestockSessionReturn {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<RestockSession | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = useCallback(async (): Promise<RestockSession | null> => {
    setIsOpening(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/operator/stores/${storeId}/restock-sessions`,
        { method: "POST" },
      );
      if (!res.ok) throw await describeFailure(res, "Could not start a restock.");

      const json = await res.json();
      const parsed = restockSessionSchema.parse(json.session);
      setSession(parsed);
      storeSessionId(storeId, parsed.id);
      return parsed;
    } catch (err) {
      setError(messageFor(err, "Could not start a restock. Try again."));
      return null;
    } finally {
      setIsOpening(false);
    }
  }, [storeId]);

  const resume = useCallback(
    async (sessionId: string): Promise<ResumeOutcome> => {
      setError(null);
      try {
        const res = await fetch(`/api/operator/restock-sessions/${sessionId}`);
        if (res.status === 404) {
          storeSessionId(storeId, null);
          return { kind: "gone" };
        }
        if (!res.ok) throw new Error(`resume answered ${res.status}`);

        const json = await res.json();
        const parsed = restockSessionSchema.parse(json.session);
        // A session someone already finished is not resumable.
        if (parsed.completedAt !== null) {
          storeSessionId(storeId, null);
          return { kind: "gone" };
        }
        const lines = z.array(restockLineSchema).parse(json.lines);
        setSession(parsed);
        return { kind: "resumed", session: parsed, lines };
      } catch {
        // Keep the stored id. Wiping it here is how one bad bar of signal
        // used to throw away a whole walk of counts.
        setError("Could not load that restock. Your progress is still saved, so try again.");
        return { kind: "failed" };
      }
    },
    [storeId],
  );

  const saveLine = useCallback(
    async (itemId: string, body: RestockLineBody): Promise<boolean> => {
      if (!session) return false;
      try {
        const res = await fetch(
          `/api/operator/restock-sessions/${session.id}/lines/${itemId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        if (!res.ok) throw new Error("line rejected");
        restockLineSchema.parse((await res.json()).line);
        return true;
      } catch {
        setError("That slot did not save. It is still on this device.");
        return false;
      }
    },
    [session],
  );

  const complete = useCallback(
    async (notes: string | null): Promise<boolean> => {
      if (!session) return false;
      setIsCompleting(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/operator/restock-sessions/${session.id}/complete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes }),
          },
        );
        if (!res.ok) throw await describeFailure(res, "Could not finish the restock.");

        storeSessionId(storeId, null);
        setSession(null);
        // Inventory and the activity feed both moved.
        await queryClient.invalidateQueries({
          queryKey: queryKeys.operator.inventory(storeId),
        });
        await queryClient.invalidateQueries({
          queryKey: queryKeys.operator.activity(storeId),
        });
        return true;
      } catch (err) {
        setError(
          messageFor(err, "Could not finish the restock. Your counts are still here."),
        );
        return false;
      } finally {
        setIsCompleting(false);
      }
    },
    [session, storeId, queryClient],
  );

  const discard = useCallback(() => {
    storeSessionId(storeId, null);
    setSession(null);
    setError(null);
  }, [storeId]);

  return {
    session,
    isOpening,
    isCompleting,
    error,
    open,
    resume,
    saveLine,
    complete,
    discard,
  };
}
