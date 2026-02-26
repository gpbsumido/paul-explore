import { auth0 } from "@/lib/auth0";
import FeatureHub from "./FeatureHub";

export default async function Protected() {
  const session = await auth0.getSession();
  const { name, email } = session?.user ?? {};

  return <FeatureHub userName={name ?? "there"} userEmail={email} />;
}
