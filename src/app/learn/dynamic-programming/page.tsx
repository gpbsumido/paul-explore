import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import dynamic from "next/dynamic";

const DPContent = dynamic(() => import("./DPContent"));

const TITLE = "Dynamic Programming";
const DESCRIPTION =
  "Overlapping subproblems, optimal substructure — the real intuition behind DP. Interactive Fibonacci table, unique paths grid fill, and climbing stairs demos.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/learn/dynamic-programming`,
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export default function DynamicProgrammingPage() {
  return <DPContent />;
}
