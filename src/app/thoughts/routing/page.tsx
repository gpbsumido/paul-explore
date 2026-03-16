import type { Metadata } from "next";
import RoutingContent from "./RoutingContent";

export const metadata: Metadata = {
  title: "Route Restructure | Thoughts",
  description: "Why the authenticated hub moved from /protected to /, the force-static trade-off, and how security is maintained.",
};

export default function RoutingPage() {
  return <RoutingContent />;
}
