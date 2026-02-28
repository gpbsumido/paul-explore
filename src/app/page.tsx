import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import LandingContent from "./LandingContent";

const TITLE = "Paul Sumido";
const DESCRIPTION =
  "Personal playground and portfolio — NBA stats, fantasy league history, Pokémon TCG browser, and write-ups on how it was built.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: SITE_URL,
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

export default async function Home() {
  const session = await auth0.getSession();

  if (session) {
    redirect("/protected");
  }

  return <LandingContent />;
}
