import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import LoginRedirectContent from "./LoginRedirectContent";

const TITLE = "Login Redirect | Thoughts";
const DESCRIPTION =
  "Landing back on the route you logged in from, and turning a denied consent screen from a bare 500 into a friendly toast — both fixed at the Auth0 choke point.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/login-redirect",
});

export const revalidate = 86400;

export default function LoginRedirectPage() {
  return <LoginRedirectContent />;
}
