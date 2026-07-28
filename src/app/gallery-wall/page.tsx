import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import GalleryWallContent from "./GalleryWallContent";

const TITLE = "Gallery Wall";
const DESCRIPTION =
  "Upload your photos and lay out a picture gallery wall. Each photo is auto-framed with the best size and orientation, every frame is yours to change, and the whole wall renders to scale against a wall size you enter.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/gallery-wall`,
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

export default function GalleryWallPage() {
  return <GalleryWallContent />;
}
