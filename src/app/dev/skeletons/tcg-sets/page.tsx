import { notFound } from "next/navigation";
import Loading from "@/app/tcg/pokemon/sets/loading";

export const metadata = { title: "Skeleton: TCG Sets" };

export default function Preview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Loading />;
}
