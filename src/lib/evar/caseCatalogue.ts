/**
 * Finding a case by id across the phantoms and the real scans, so every page
 * names them the same way instead of each looking in its own list.
 */

import { EVAR_CASES } from "./phantom";
import type { PracticeCase, ScanCase } from "./scans";

export function findCase(id: string, scans: readonly ScanCase[]): PracticeCase | undefined {
  return EVAR_CASES.find((c) => c.id === id) ?? scans.find((c) => c.id === id);
}

/** A case's title, or its id when it isn't known (yet), so nothing renders blank. */
export function caseTitle(id: string, scans: readonly ScanCase[]): string {
  return findCase(id, scans)?.title ?? id;
}
