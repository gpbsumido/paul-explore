import { notFound } from "next/navigation";
import Loading from "@/app/protected/loading";

export const metadata = { title: "Skeleton: Protected Hub" };

export default function Preview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Loading />;
}
