import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import WorldContent from "./WorldContent";

export const metadata: Metadata = {
  title: "Explore Toronto | paul-explore",
  description:
    "Walk a low-poly downtown Toronto at night — WASD through real streets, past the CN Tower and Nathan Phillips Square, and visit exhibits that open every feature on this site.",
  openGraph: {
    title: "Explore Toronto — a 3D world of this site",
    description:
      "An explorable night-time Toronto where every landmark hosts one of this site's features.",
    url: `${SITE_URL}/world`,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Toronto — a 3D world of this site",
    description:
      "An explorable night-time Toronto where every landmark hosts one of this site's features.",
  },
};

export default function WorldPage() {
  return <WorldContent />;
}
