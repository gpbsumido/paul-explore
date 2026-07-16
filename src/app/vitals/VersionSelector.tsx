"use client";

import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";

interface VersionSelectorProps {
  versions: string[];
  selectedVersion: string;
}

type MinorGroup = { minor: string; versions: string[] };

/**
 * Groups a flat list of semver strings (newest-first) into the structure
 * the dropdown needs:
 * - Current Major (all data in this major version)
 * - Current Minor (all patches in the latest minor)
 * - Last 3 minor versions with individual patch versions
 * - Older minors aggregated (one entry per minor)
 */
function groupVersions(versions: string[]) {
  if (versions.length === 0) return null;

  const [major, minor] = versions[0].split(".").map(Number);
  const currentMajor = String(major);
  const currentMinorKey = `${major}.${minor}`;

  // bucket every version by its major.minor key
  const groups = new Map<string, string[]>();
  for (const v of versions) {
    const parts = v.split(".");
    const key = `${parts[0]}.${parts[1]}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(v);
  }

  // sort minor keys descending by semver
  const sortedKeys = [...groups.keys()].sort((a, b) => {
    const [aMaj, aMin] = a.split(".").map(Number);
    const [bMaj, bMin] = b.split(".").map(Number);
    return bMaj - aMaj || bMin - aMin;
  });

  // current minor is first key; next 3 are "recent"; rest are "older"
  const currentIdx = sortedKeys.indexOf(currentMinorKey);
  const recentKeys = sortedKeys.slice(currentIdx + 1, currentIdx + 4);
  const olderKeys = sortedKeys.slice(currentIdx + 4);

  return {
    currentMajor,
    currentMinorKey,
    recentMinors: recentKeys.map(
      (key): MinorGroup => ({ minor: key, versions: groups.get(key)! }),
    ),
    olderMinors: olderKeys,
  };
}

/**
 * Dropdown for filtering vitals data by version scope. Uses startTransition
 * so the router.push() is treated as a non-urgent update.
 *
 * URL values encode the filter mode via prefix:
 *   "major:0"    → all data in major version 0
 *   "minor:0.12" → all data in minor version 0.12
 *   "0.11.3"     → exact version match
 */
export default function VersionSelector({
  versions,
  selectedVersion,
}: VersionSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const grouped = useMemo(() => groupVersions(versions), [versions]);

  if (!grouped) return null;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    startTransition(() => {
      router.push(`?v=${encodeURIComponent(v)}`);
    });
  }

  return (
    <select
      value={selectedVersion}
      onChange={handleChange}
      disabled={isPending}
      aria-label="Filter by version"
      className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-medium text-muted focus:outline-none disabled:opacity-50"
    >
      <option value={`major:${grouped.currentMajor}`}>
        Current Major (v{grouped.currentMajor}.x)
      </option>
      <option value={`minor:${grouped.currentMinorKey}`}>
        Current Minor (v{grouped.currentMinorKey})
      </option>

      {grouped.recentMinors.map(({ minor, versions: patches }) => (
        <optgroup key={minor} label={`v${minor}`}>
          {patches.map((v) => (
            <option key={v} value={v}>
              v{v}
            </option>
          ))}
        </optgroup>
      ))}

      {grouped.olderMinors.length > 0 && (
        <optgroup label="Older">
          {grouped.olderMinors.map((key) => (
            <option key={key} value={`minor:${key}`}>
              v{key}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
