"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createReferral,
  getReferralStats,
  type CreateReferralInput,
  type Referral,
  type ReferralStats,
} from "@/lib/referrals";

/** Create a referral link. On success returns the slug + shareable url. */
// ts-prune-ignore-next -- public hook, consumed by the referral-links demo in a later phase
export function useCreateReferral() {
  return useMutation<Referral, Error, CreateReferralInput>({
    mutationFn: createReferral,
  });
}

/**
 * Poll a referral's click stats. Disabled until a slug exists; refetches on an
 * interval so the demo shows counts ticking up.
 */
// ts-prune-ignore-next -- public hook, consumed by the referral-links demo in a later phase
export function useReferralStats(slug: string | null) {
  return useQuery<ReferralStats>({
    queryKey: ["referrals", "stats", slug],
    queryFn: () => getReferralStats(slug as string),
    enabled: Boolean(slug),
    refetchInterval: 10_000,
  });
}
