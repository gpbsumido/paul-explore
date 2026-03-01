import { notFound } from "next/navigation";
import Loading from "@/app/tcg/pocket/loading";

export const metadata = { title: "Skeleton: TCG Pocket" };

export default function Preview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Loading />;
}
