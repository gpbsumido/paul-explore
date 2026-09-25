import type { HostServices } from "@paul-portfolio/work-portfolio-contract";
import {
  createReferral,
  getReferralStats,
  recordReferralClick,
} from "@/lib/referrals";

/**
 * What the host lends a remote. The referral client already turns API
 * refusals into readable errors and lets network failures surface as fetch's
 * TypeError, which is exactly what the contract promises, so this is wiring.
 */
export function hostServices(): HostServices {
  return {
    referrals: {
      create: createReferral,
      stats: getReferralStats,
      recordClick: recordReferralClick,
    },
  };
}
