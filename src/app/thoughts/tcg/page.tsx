import type { Metadata } from "next";
import dynamic from "next/dynamic";
import ThoughtsSkeleton from "@/components/ThoughtsSkeleton";

export const metadata: Metadata = {
  title: "TCG Pages | Thoughts",
  description:
    "How and why the Pokemon TCG browser was built — API proxy architecture, server/client splits, pagination patterns, and trade-offs.",
};

// Lazy-load so the TCG write-up chunk only downloads when someone actually
// navigates here — keeps the main bundle from growing with each thoughts page.
const TcgContent = dynamic(() => import("./TcgContent"), {
  loading: () => <ThoughtsSkeleton />,
});

export default function TcgPage() {
  return <TcgContent />;
}
