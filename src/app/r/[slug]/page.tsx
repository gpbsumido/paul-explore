import type { Metadata } from "next";
import ReferralLanding from "./ReferralLanding";

export const metadata: Metadata = {
  title: "You followed a link — paul-explore",
  robots: { index: false },
};

/**
 * Landing for a referral link (/r/<slug>). The work-portfolio referral demo
 * mints these; this gives them somewhere friendly to land instead of a 404. It
 * best-effort records the click and points the visitor into the site.
 */
export default async function ReferralPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ReferralLanding slug={slug} />;
}
