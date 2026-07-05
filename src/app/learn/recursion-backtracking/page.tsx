import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import dynamic from "next/dynamic";

const RecursionBacktrackingContent = dynamic(
  () => import("./RecursionBacktrackingContent"),
);

const TITLE = "Recursion & Backtracking";
const DESCRIPTION =
  "Solve it by solving a smaller version. Undo what doesn't work. Interactive Fibonacci call tree with memoization toggle and backtracking subsets demo.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/learn/recursion-backtracking`,
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

export default function RecursionBacktrackingPage() {
  return <RecursionBacktrackingContent />;
}
