import type { Metadata } from "next";
import TcgContent from "./TcgContent";

export const metadata: Metadata = {
  title: "TCG Pages | Thoughts",
  description:
    "How and why the Pokemon TCG browser was built — API proxy architecture, server/client splits, pagination patterns, and trade-offs.",
};

export default function TcgPage() {
  return <TcgContent />;
}
