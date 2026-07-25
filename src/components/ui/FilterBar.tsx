"use client";

import { type ReactNode } from "react";
import { FilterBar as PaulFilterBar } from "@paul-portfolio/react";

interface FilterBarProps {
  /** Accessible name for the region, e.g. "Team and player filters" */
  label: string;
  className?: string;
  children: ReactNode;
}

/**
 * App-level FilterBar backed by @paul-portfolio/react. A labelled region that
 * holds a wrapping row of filter controls (typically Select). Replaces the old
 * page-local FilterBar under fantasy/nba.
 */
export default function FilterBar({ label, className, children }: FilterBarProps) {
  return (
    <PaulFilterBar label={label} className={className}>
      {children}
    </PaulFilterBar>
  );
}
