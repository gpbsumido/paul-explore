import type { Metadata } from "next";
import { Suspense } from "react";
import PageShell from "@/components/PageShell";
import DisplayContent from "./DisplayContent";

export const metadata: Metadata = {
  title: "Check-in display",
  description: "The rotating arrival code for a site, for the screen at the entrance.",
  // The code is only meaningful to someone standing in front of it, and the
  // page needs a session anyway, so there is nothing here for a crawler.
  robots: { index: false, follow: false },
};

export default function CheckInDisplayPage() {
  return (
    <PageShell>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
          <DisplayContent />
        </Suspense>
      </main>
    </PageShell>
  );
}
