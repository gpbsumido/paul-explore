import PageHeader from "@/components/PageHeader";

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Lab", badge: true },
        ]}
        zIndex="z-30"
      />
      {children}
    </div>
  );
}
