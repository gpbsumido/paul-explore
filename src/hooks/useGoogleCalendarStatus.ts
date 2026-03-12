import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Returns whether the current user has connected their Google Calendar.
 * Refetches every 5 minutes so the calendar header indicator stays accurate,
 * but not so aggressively that it adds noise to the network tab.
 *
 * Returns `connected: false` during loading so callers never have to check
 * both `loading` and `connected` to decide whether to show the indicator.
 */
export function useGoogleCalendarStatus(): {
  connected: boolean;
  loading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.google.authStatus(),
    queryFn: async (): Promise<{ connected: boolean }> => {
      const res = await fetch("/api/google/auth/status");
      if (!res.ok) return { connected: false };
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    connected: data?.connected ?? false,
    loading: isLoading,
  };
}
