/**
 * Reference answers an admin has set by hand, and how they sit over the
 * phantom's own geometry.
 *
 * The phantom computes its references exactly, but "exact" is only as good as
 * the definition behind it. When a case's answer needs correcting, an admin
 * saves the five scored numbers and they win. Everything else, like the slice
 * the sac starts on, still comes from the geometry.
 */

import { z } from "zod";
import { referenceFor, type EvarCase } from "./phantom";

const referenceRowSchema = z.object({
  caseId: z.string(),
  neckDiameter: z.number(),
  neckLength: z.number(),
  maxSac: z.number(),
  rightCia: z.number(),
  leftCia: z.number(),
  note: z.string().nullable(),
  updatedAt: z.string(),
});

export const referencesResponseSchema = z.object({ references: z.array(referenceRowSchema) });

export type ReferenceRow = z.infer<typeof referenceRowSchema>;

/** The case's reference, with a hand-set row for it taking over the five scored values. */
export function referenceWithOverride(c: EvarCase, overrides: readonly ReferenceRow[]) {
  const phantom = referenceFor(c);
  const row = overrides.find((o) => o.caseId === c.id);
  if (!row) return phantom;
  return {
    ...phantom,
    neckDiameter: row.neckDiameter,
    neckLength: row.neckLength,
    maxSac: row.maxSac,
    rightCia: row.rightCia,
    leftCia: row.leftCia,
  };
}
