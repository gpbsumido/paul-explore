import { notFound } from "next/navigation";
import Loading from "@/app/loading";

export const metadata = { title: "Skeleton: Hub" };

export default function Preview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Loading />;
}
