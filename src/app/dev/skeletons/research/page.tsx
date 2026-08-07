import { notFound } from "next/navigation";
import Loading from "@/app/research/loading";

export const metadata = { title: "Skeleton: Research" };

export default function Preview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Loading />;
}
