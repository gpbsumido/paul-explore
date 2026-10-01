import { toOrigin } from "@/lib/csp";

/** A micro-frontend remote this site can mount: where its manifest lives, and the origin the CSP has to allow. */
export type RemoteConfig = {
  name: string;
  manifestUrl: string;
  origin: string;
};

type Env = Partial<Record<string, string | undefined>>;

/** Where the work-portfolio remote's production build publishes its manifest. */
const PRODUCTION_MANIFEST = "https://work-portfolio-mfe.vercel.app/mf-manifest.json";

/**
 * The work-portfolio remote. WORK_PORTFOLIO_REMOTE_URL (the full URL of an
 * mf-manifest.json) points it somewhere else, e.g. a remote running locally on
 * :3100; unset, it's the production deployment, since there is no in-repo copy
 * left to fall back to. Null only when the variable is set to something that
 * isn't a URL, which the page shows as the remote being unavailable.
 */
export function workPortfolioRemote(env: Env = process.env): RemoteConfig | null {
  const manifestUrl = env.WORK_PORTFOLIO_REMOTE_URL?.trim() || PRODUCTION_MANIFEST;
  const origin = toOrigin(manifestUrl);
  if (!origin) return null;
  return { name: "workPortfolio", manifestUrl, origin };
}
