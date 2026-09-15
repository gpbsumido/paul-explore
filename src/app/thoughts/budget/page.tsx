import type { Metadata } from "next";
import { buildArticleMetadata } from "@/lib/site";
import BudgetThoughtsContent from "./BudgetThoughtsContent";

const TITLE = "Three taps to log a spend | Thoughts";
const DESCRIPTION =
  "Building a budget tracker around the add flow: a three-step bottom sheet, money kept in integer cents (and the rounding bug that caught me), analytics that take the clock as an argument, and an invite link that carries the whole budget because there is no server yet.";

export const metadata: Metadata = buildArticleMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/thoughts/budget",
});

export const revalidate = 86400;

export default function BudgetThoughtsPage() {
  return <BudgetThoughtsContent />;
}
