import type { Metadata } from "next";
import StatsContent from "./StatsContent";

export const metadata: Metadata = {
  title: "NBA Player Stats",
  description: "NBA player statistics by team — points, rebounds, assists, and more.",
};

export default function StatsPage() {
  return <StatsContent />;
}
