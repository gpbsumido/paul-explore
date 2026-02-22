import type { Metadata } from "next";
import LeagueContent from "./LeagueContent";

export const metadata: Metadata = {
  title: "League History",
  description:
    "ESPN fantasy basketball league standings, records, and rosters.",
};

export default function LeagueHistoryPage() {
  return <LeagueContent />;
}
