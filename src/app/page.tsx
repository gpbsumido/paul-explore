import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import LandingContent from "./LandingContent";

export default async function Home() {
  const session = await auth0.getSession();

  if (session) {
    redirect("/protected");
  }

  return <LandingContent />;
}
