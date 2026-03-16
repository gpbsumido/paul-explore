import type { ReactNode } from "react";
import PageHeader from "@/components/PageHeader";

export default function EventsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Calendar", href: "/calendar" },
          { label: "Events" },
        ]}
      />
      {children}
    </div>
  );
}
