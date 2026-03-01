import { notFound } from "next/navigation";
import Loading from "@/app/tcg/pokemon/card/[cardId]/loading";

export const metadata = { title: "Skeleton: TCG Card Detail" };

export default function Preview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Loading />;
}
