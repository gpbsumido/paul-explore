import type { Metadata } from "next";
import dynamic from "next/dynamic";
import ThoughtsSkeleton from "@/components/ThoughtsSkeleton";

export const metadata: Metadata = {
  title: "Styling Decisions | Thoughts",
  description:
    "How I set up design tokens, reusable components, and theming — told as a conversation.",
};

// Lazy-load the content component so its JS chunk ships separately.
// The demo components in StylingContent pull in Button, Modal, and Input,
// so keeping them out of the initial bundle is worth the split.
const StylingContent = dynamic(() => import("./StylingContent"), {
  loading: () => <ThoughtsSkeleton />,
});

export default function StylingPage() {
  return <StylingContent />;
}
