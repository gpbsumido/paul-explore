import { notFound } from "next/navigation";
import FeatureHubV4 from "@/app/v4/FeatureHubV4";

export const metadata = { title: "Preview: v4 Hub" };

export default function Preview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <FeatureHubV4
      initialMe={{ name: "Paul Sumido", email: "paul@example.com" }}
    />
  );
}
