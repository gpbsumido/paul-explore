import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import VolunteerCheckInContent from "./VolunteerCheckInContent";

const TITLE = "Proving Someone Actually Showed Up | Thoughts";
const DESCRIPTION =
  "Confirming a volunteer arrived on site with a code that rotates every two minutes: why the NFC half of the idea had to go, how the code is derived rather than stored, the four ways it could have been cheated, and the one hole that stays open.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/volunteer-check-in",
});

export const revalidate = 86400;

export default function VolunteerCheckInThoughtsPage() {
  return <VolunteerCheckInContent />;
}
