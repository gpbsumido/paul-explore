import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { queryKeys } from "@/lib/queryKeys";

const statusSchema = z.object({ connected: z.boolean() });

/**
 * Returns whether the current user has connected their Google Calendar.
 * The answer stays fresh for 5 minutes, so the header indicator doesn't
 * refetch on every mount.
 *
 * A 401 means "not connected". Anything else that goes wrong (a 500, a body
 * that doesn't parse) is `statusUnavailable`, because telling someone to
 * connect an account they already connected sends them the wrong way.
 *
 * Returns `connected: false` during loading so callers never have to check
 * both `loading` and `connected` to decide whether to show the indicator.
 */
export function useGoogleCalendarStatus(): {
  connected: boolean;
  loading: boolean;
  statusUnavailable: boolean;
} {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.google.authStatus(),
    queryFn: async (): Promise<{ connected: boolean }> => {
      const res = await fetch("/api/google/auth/status");
      if (res.status === 401) return { connected: false };
      if (!res.ok) throw new Error(`Google status check responded ${res.status}`);
      return statusSchema.parse(await res.json());
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    connected: data?.connected ?? false,
    loading: isLoading,
    statusUnavailable: isError,
  };
}
