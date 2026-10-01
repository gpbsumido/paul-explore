import { CatalogSchema } from "@paul-portfolio/work-portfolio-contract";
import type { RemoteConfig } from "./remotes";

export type CatalogCounts = { projects: number; features: number };

/**
 * How many projects and feature demos the work portfolio has, read from the
 * catalog.json the remote publishes beside its manifest. The remote owns the
 * catalog, so this is the only place the host learns the numbers; revalidated
 * daily, like the write-up that shows them.
 *
 * Null whenever the answer can't be trusted: no remote, an unreachable one, an
 * error status, or a catalog that doesn't match the contract.
 */
export async function workPortfolioCounts(
  remote: RemoteConfig | null,
): Promise<CatalogCounts | null> {
  if (!remote) return null;
  try {
    const res = await fetch(`${remote.origin}/catalog.json`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const parsed = CatalogSchema.safeParse(await res.json());
    if (!parsed.success) return null;
    return {
      projects: parsed.data.projects.length,
      features: parsed.data.features.length,
    };
  } catch {
    return null;
  }
}
