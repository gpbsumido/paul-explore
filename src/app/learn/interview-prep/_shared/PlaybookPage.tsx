import type { ReactNode } from "react";
import PageHeader, { type BreadcrumbItem } from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import type { Phase } from "@/lib/leetcode/types";
import PlaybookNav, { type PlaybookSection } from "./PlaybookNav";

/** Roadmap phase names, shared by the hub and the pattern pages. */
export const PHASE_TITLES: Record<Phase, string> = {
  1: "Arrays and strings",
  2: "Structures",
  3: "Search and graphs",
  4: "Optimisation",
};

/**
 * The frame every playbook page sits in: the Learn shell and accent, the
 * breadcrumb trail, the playbook nav, and a readable column.
 */
export default function PlaybookPage({
  breadcrumbs,
  current,
  children,
}: {
  breadcrumbs: BreadcrumbItem[];
  current: PlaybookSection;
  children: ReactNode;
}) {
  return (
    <PageShell colorA="var(--color-feature-learn)" colorB="var(--color-secondary-500)">
      <PageHeader breadcrumbs={breadcrumbs} maxWidth="max-w-3xl" />
      <main className="relative mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <PlaybookNav current={current} />
        {children}
      </main>
    </PageShell>
  );
}
