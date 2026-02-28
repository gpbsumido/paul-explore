import type { Metadata } from "next";
import BundleContent from "./BundleContent";

export const metadata: Metadata = {
  title: "Bundle Analysis | Thoughts",
  description:
    "How running the bundle analyzer revealed Auth0Provider pulling jose, oauth4webapi, and openid-client into the browser bundle — and why removing it cost nothing.",
};

export default function BundleThoughtsPage() {
  return <BundleContent />;
}
