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
import type { Reference } from "./measure";
import type { PracticeCase } from "./scans";

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
function referenceWithOverride(c: EvarCase, overrides: readonly ReferenceRow[]) {
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

/**
 * What a case is scored against: a phantom's own geometry under any hand-set
 * row, or a real scan's hand-set row and nothing else. Null means nobody has
 * measured that scan yet.
 */
export function referenceForCase(c: PracticeCase, overrides: readonly ReferenceRow[]): Reference | null {
  if (c.kind === "phantom") return referenceWithOverride(c, overrides);
  const row = overrides.find((o) => o.caseId === c.id);
  if (!row) return null;
  return { neckDiameter: row.neckDiameter, neckLength: row.neckLength, maxSac: row.maxSac, rightCia: row.rightCia, leftCia: row.leftCia };
}
