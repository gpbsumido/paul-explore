import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import TypeScript7Content from "./TypeScript7Content";

const TITLE = "Not Upgrading to TypeScript 7 (Yet) | Thoughts";
const DESCRIPTION =
  "TypeScript 7 shipped a Go-native compiler that is 8-12x faster, and this project is staying on 5.9. Why the lint stack blocks it, what the 4-second type-check says about the payoff, and the plan for getting the speed anyway.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/typescript-7`,
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

export const revalidate = 86400;

export default function TypeScript7ThoughtsPage() {
  return <TypeScript7Content />;
}
