"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface VersionSelectorProps {
  versions: string[];
  selectedVersion: string | undefined;
}

/**
 * Dropdown for filtering vitals data by app version. Uses startTransition so
 * the router.push() is treated as a non-urgent update -- the browser can handle
 * any queued input events before React starts re-rendering with the new data.
 */
export default function VersionSelector({
  versions,
  selectedVersion,
}: VersionSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (versions.length === 0) return null;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    startTransition(() => {
      if (v === "all") {
        router.push("?v=all");
      } else {
        router.push(`?v=${encodeURIComponent(v)}`);
      }
    });
  }

  return (
    <select
      value={selectedVersion ?? "all"}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-medium text-muted focus:outline-none disabled:opacity-50"
    >
      <option value="all">All versions</option>
      {versions.map((v) => (
        <option key={v} value={v}>
          From v{v}
        </option>
      ))}
    </select>
  );
}
