// Client for the portfolio_api referrals endpoints (public, no auth). Called
// from the work-portfolio referral-links demo in the browser; CORS on the API
// already allows the site origins.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const BASE = `${API_URL}/api/referrals`;

export interface Referral {
  slug: string;
  targetPath: string;
  label: string | null;
  url: string;
  clicks: number;
  createdAt: string;
}

export interface ReferralStats {
  slug: string;
  targetPath: string;
  clicks: number;
  recent: { at: string }[];
}

export interface CreateReferralInput {
  slug?: string;
  targetPath?: string;
  label?: string;
}

async function parseOrThrow<T>(res: Response, fallback: string): Promise<T> {
  if (res.ok) return res.json() as Promise<T>;
  if (res.status === 409) throw new Error("That slug is already taken.");
  if (res.status === 400) throw new Error("Slug must be 3-32 lowercase letters, numbers, or dashes.");
  if (res.status === 404) throw new Error("That referral link does not exist.");
  throw new Error(fallback);
}

export async function createReferral(
  input: CreateReferralInput,
): Promise<Referral> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseOrThrow<Referral>(res, "Could not create the referral link.");
}

export async function getReferral(slug: string): Promise<Referral> {
  const res = await fetch(`${BASE}/${slug}`);
  return parseOrThrow<Referral>(res, "Could not load the referral link.");
}

export async function recordReferralClick(
  slug: string,
): Promise<{ slug: string; targetPath: string; clicks: number }> {
  const res = await fetch(`${BASE}/${slug}/clicks`, { method: "POST" });
  return parseOrThrow(res, "Could not record the click.");
}

export async function getReferralStats(slug: string): Promise<ReferralStats> {
  const res = await fetch(`${BASE}/${slug}/stats`);
  return parseOrThrow<ReferralStats>(res, "Could not load referral stats.");
}
