import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import SitesContent from "./SitesContent";

export const metadata: Metadata = {
  title: "Check-in sites",
  description: "Sites you run, their displays, and who has checked in today.",
  robots: { index: false, follow: false },
};

export default function CheckInSitesPage() {
  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[
          { label: "Hub", href: "/" },
          { label: "Check-in", href: "/check-in" },
          { label: "Sites" },
        ]}
      />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">Your sites</h1>
        <p className="mt-1 mb-6 text-sm text-muted">
          Put a site&apos;s display up at the entrance and share its check-in
          link with volunteers. Arrivals are recorded against whoever is signed
          in, and a code only works for a couple of minutes.
        </p>
        <SitesContent />
      </main>
    </PageShell>
  );
}
