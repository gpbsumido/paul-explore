// Client for portfolio_api's mirrored TCGdex catalog. Public read, so it goes
// straight to the API rather than through the BFF, the same way feature-flag
// reads do.
//
// The point of the mirror is that these pages stop depending on TCGdex being
// fast. Rendering used to list every series and then fetch each one, which
// timed out `next build` and, at request time, produced an empty list that ISR
// cached for a day — an outage that read as data nobody had updated.

import { z } from "zod";
import { API_URL } from "@/lib/apiUrl";

export const catalogSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  logo: z.string().nullable(),
  symbol: z.string().nullable(),
  // Null for a set announced but not yet detailed. Rendering that as 0 would
  // be a lie, so the type keeps the absence visible.
  cardCountOfficial: z.number().nullable(),
  cardCountTotal: z.number().nullable(),
});

export const catalogSerieSchema = z.object({
  id: z.string(),
  name: z.string(),
  logo: z.string().nullable(),
  sets: z.array(catalogSetSchema),
});

export const catalogSchema = z.object({
  series: z.array(catalogSerieSchema),
  /** When the ingest last wrote, so the UI can say how fresh this is. */
  updatedAt: z.string().nullable(),
});

export type CatalogSet = z.infer<typeof catalogSetSchema>;
export type CatalogSerie = z.infer<typeof catalogSerieSchema>;
export type Catalog = z.infer<typeof catalogSchema>;

/**
 * The catalog, or null when it could not be read.
 *
 * Null means "the request failed"; a catalog with no series means "nothing has
 * been ingested yet". Those have to stay distinguishable, because collapsing
 * them into one empty list is exactly how an outage passed for stale data.
 */
export async function fetchCatalog(): Promise<Catalog | null> {
  try {
    const res = await fetch(`${API_URL}/api/tcg/catalog`, {
      // Deliberate: this keeps the pages that read it out of `next build`
      // entirely. Freshness is handled upstream by the catalog endpoint's own
      // s-maxage, so opting out here costs a CDN hit rather than a round trip
      // to Postgres.
      cache: "no-store",
    });
    if (!res.ok) return null;
    return catalogSchema.parse(await res.json());
  } catch {
    return null;
  }
}
