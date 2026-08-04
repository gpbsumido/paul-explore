/**
 * Resolves the version filter for the Web Vitals dashboard from the URL's ?v
 * value. The selector encodes its mode as a prefix:
 *   "major:0"    → mode=major, v=0   (all 0.x.y versions)
 *   "minor:0.12" → mode=minor, v=0.12 (all 0.12.x versions)
 *   "0.11.3"     → no mode, exact match
 *   undefined    → default to the current major, so the data matches what the
 *                  selector shows ("Current Major") rather than all-time aggregates.
 */
export function resolveVitalsFilter(
  urlVersion: string | undefined,
  defaultMajor: string,
): {
  filterMode: string | undefined;
  filterVersion: string | undefined;
  selectedVersion: string;
} {
  if (urlVersion?.startsWith("major:")) {
    return {
      filterMode: "major",
      filterVersion: urlVersion.slice(6),
      selectedVersion: urlVersion,
    };
  }
  if (urlVersion?.startsWith("minor:")) {
    return {
      filterMode: "minor",
      filterVersion: urlVersion.slice(6),
      selectedVersion: urlVersion,
    };
  }
  if (urlVersion) {
    return {
      filterMode: undefined,
      filterVersion: urlVersion,
      selectedVersion: urlVersion,
    };
  }
  return {
    filterMode: "major",
    filterVersion: defaultMajor,
    selectedVersion: `major:${defaultMajor}`,
  };
}
