"use client";

import { useRouter } from "next/navigation";
import OperatorSearch from "@/components/operator/OperatorSearch";

/**
 * Wires the search combobox to navigation. Kept apart from the component so the
 * component itself stays router-free and testable; here is the only place a
 * selection turns into a route change.
 */
export default function OperatorSearchView() {
  const router = useRouter();
  return <OperatorSearch onSelect={(item) => router.push(item.href)} />;
}
