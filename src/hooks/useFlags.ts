"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import type { AuditEntry, Flag } from "@/types/flags";
import { queryKeys } from "@/lib/queryKeys";
import { flagSchema, auditEntrySchema } from "@/lib/flags-schemas";
import { queryErrorMessage } from "./queryErrorMessage";

const EMPTY_FLAGS: Flag[] = [];
const EMPTY_AUDIT: AuditEntry[] = [];

export interface UseFlagsReturn {
  flags: Flag[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches the full flag list. Flags change only when an operator edits them in
 * this same session, so there is no background poll — the mutation hooks
 * invalidate this query directly after a successful write.
 */
export function useFlags(): UseFlagsReturn {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.flags.list(),
    queryFn: async ({ signal }): Promise<Flag[]> => {
      const res = await fetch("/api/flags", { signal });
      if (!res.ok) throw new Error("Failed to fetch flags");
      const json = await res.json();
      return z.array(flagSchema).parse(json.flags);
    },
    staleTime: 30_000,
  });

  return {
    flags: data ?? EMPTY_FLAGS,
    loading: isLoading,
    error: queryErrorMessage(isError, error, "Failed to load flags."),
  };
}

/** Fetches the flag-change audit log, newest first. */
export function useFlagAudit(): { audit: AuditEntry[] } {
  const { data } = useQuery({
    queryKey: queryKeys.flags.audit(),
    queryFn: async ({ signal }): Promise<AuditEntry[]> => {
      const res = await fetch("/api/flags/audit", { signal });
      if (!res.ok) throw new Error("Failed to fetch audit log");
      const json = await res.json();
      return z.array(auditEntrySchema).parse(json.audit);
    },
    staleTime: 30_000,
  });

  return { audit: data ?? EMPTY_AUDIT };
}
