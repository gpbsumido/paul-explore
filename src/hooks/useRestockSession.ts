"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import {
  restockLineSchema,
  restockSessionSchema,
} from "@/lib/operator-schemas";
import type { RestockLineBody } from "@/lib/operator-restock-types";
import type { RestockSession } from "@/types/operator";

const STORAGE_PREFIX = "operator-restock-session";

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

export type UseRestockSessionReturn = {
  session: RestockSession | null;
  isOpening: boolean;
  isCompleting: boolean;
  error: string | null;
  open: () => Promise<RestockSession | null>;
  resume: (sessionId: string) => Promise<RestockSession | null>;
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
      if (!res.ok) throw new Error("Could not start a restock");

      const json = await res.json();
      const parsed = restockSessionSchema.parse(json.session);
      setSession(parsed);
      storeSessionId(storeId, parsed.id);
      return parsed;
    } catch {
      setError("Could not start a restock. Try again.");
      return null;
    } finally {
      setIsOpening(false);
    }
  }, [storeId]);

  const resume = useCallback(
    async (sessionId: string): Promise<RestockSession | null> => {
      try {
        const res = await fetch(`/api/operator/restock-sessions/${sessionId}`);
        if (!res.ok) throw new Error("gone");

        const json = await res.json();
        const parsed = restockSessionSchema.parse(json.session);
        // A session someone already finished is not resumable.
        if (parsed.completedAt !== null) {
          storeSessionId(storeId, null);
          return null;
        }
        setSession(parsed);
        return parsed;
      } catch {
        storeSessionId(storeId, null);
        return null;
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
        if (!res.ok) throw new Error("complete failed");

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
      } catch {
        setError("Could not finish the restock. Your counts are still here.");
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
