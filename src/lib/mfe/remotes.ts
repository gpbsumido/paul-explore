import { toOrigin } from "@/lib/csp";

/** A micro-frontend remote this site can mount: where its manifest lives, and the origin the CSP has to allow. */
export type RemoteConfig = {
  name: string;
  manifestUrl: string;
  origin: string;
};

type Env = Partial<Record<string, string | undefined>>;

/**
 * The work-portfolio remote, from WORK_PORTFOLIO_REMOTE_URL (the full URL of
 * its mf-manifest.json). Absent when unset or not a URL, which simply means
 * the in-repo portfolio keeps serving.
 */
export function workPortfolioRemote(env: Env = process.env): RemoteConfig | null {
  const manifestUrl = env.WORK_PORTFOLIO_REMOTE_URL?.trim();
  const origin = toOrigin(manifestUrl);
  if (!manifestUrl || !origin) return null;
  return { name: "workPortfolio", manifestUrl, origin };
}

/**
 * WORK_PORTFOLIO_REMOTE_OVERRIDE forces the decision either way: "on" so e2e
 * can drive the composed page without touching the flag, "off" as a kill
 * switch that doesn't depend on the flags API being up.
 */
export function remoteOverride(env: Env = process.env): "on" | "off" | null {
  const value = env.WORK_PORTFOLIO_REMOTE_OVERRIDE?.trim();
  return value === "on" || value === "off" ? value : null;
}

/** Whether this request gets the remote, given what is configured and what the flag said. */
export function servesWorkPortfolioRemote({
  remote,
  override,
  flagOn,
}: {
  remote: RemoteConfig | null;
  override: "on" | "off" | null;
  flagOn: boolean;
}): boolean {
  if (!remote) return false;
  if (override) return override === "on";
  return flagOn;
}
