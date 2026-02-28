"use client";

import { useRouter } from "next/navigation";

interface VersionSelectorProps {
  versions: string[];
  selectedVersion: string | undefined;
}

export default function VersionSelector({
  versions,
  selectedVersion,
}: VersionSelectorProps) {
  const router = useRouter();

  if (versions.length === 0) return null;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    if (v === "all") {
      router.push("?v=all");
    } else {
      router.push(`?v=${encodeURIComponent(v)}`);
    }
  }

  return (
    <select
      value={selectedVersion ?? "all"}
      onChange={handleChange}
      className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-medium text-muted focus:outline-none"
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
