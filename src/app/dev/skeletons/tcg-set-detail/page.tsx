import { notFound } from "next/navigation";
import Loading from "@/app/tcg/pokemon/sets/[setId]/loading";

export const metadata = { title: "Skeleton: TCG Set Detail" };

export default function Preview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Loading />;
}
