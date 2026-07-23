"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReferral,
  getReferralStats,
  recordReferralClick,
  type CreateReferralInput,
  type Referral,
  type ReferralStats,
} from "@/lib/referrals";

/** Create a referral link. On success returns the slug + shareable url. */
export function useCreateReferral() {
  return useMutation<Referral, Error, CreateReferralInput>({
    mutationFn: createReferral,
  });
}

/**
 * Poll a referral's click stats. Disabled until a slug exists; refetches on an
 * interval so the demo shows counts ticking up.
 */
export function useReferralStats(slug: string | null) {
  return useQuery<ReferralStats>({
    queryKey: ["referrals", "stats", slug],
    queryFn: () => getReferralStats(slug as string),
    enabled: Boolean(slug),
    refetchInterval: 10_000,
  });
}

/**
 * Record a click on a referral link. On success it invalidates that link's
 * stats query so the count moves live — no manual refetch from the caller.
 */
export function useRecordReferralClick() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => recordReferralClick(slug),
    onSuccess: (_data, slug) =>
      queryClient.invalidateQueries({
        queryKey: ["referrals", "stats", slug],
      }),
  });
}
