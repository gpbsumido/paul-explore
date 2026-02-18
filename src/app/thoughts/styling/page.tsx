import type { Metadata } from "next";
import StylingContent from "./StylingContent";

export const metadata: Metadata = {
  title: "Styling Decisions | Thoughts",
  description:
    "How I set up design tokens, reusable components, and theming — told as a conversation.",
};

export default function StylingPage() {
  return <StylingContent />;
}
