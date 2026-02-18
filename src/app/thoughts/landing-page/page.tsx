import type { Metadata } from "next";
import LandingPageContent from "./LandingPageContent";

export const metadata: Metadata = {
  title: "Landing Page | Thoughts",
  description: "How I built the landing page",
};

export default function SearchBarPage() {
  return <LandingPageContent />;
}
