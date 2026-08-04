import type { Metadata } from "next";
import { SITE_URL, OG_IMAGE } from "@/lib/site";
import LoginRedirectContent from "./LoginRedirectContent";

const TITLE = "Login Redirect | Thoughts";
const DESCRIPTION =
  "Landing back on the route you logged in from, and turning a denied consent screen from a bare 500 into a friendly toast — both fixed at the Auth0 choke point.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "article",
    url: `${SITE_URL}/thoughts/login-redirect`,
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

export default function LoginRedirectPage() {
  return <LoginRedirectContent />;
}
