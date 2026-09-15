"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import BudgetContent from "./BudgetContent";
import ServerBudgetContent from "./ServerBudgetContent";
import BudgetLoading from "./loading";

/**
 * Picks the data source by who is looking. A signed-in visitor gets the
 * server-backed budget (shared, synced across devices); everyone else keeps the
 * localStorage budget, which needs no account. The choice hangs on /api/me, the
 * same client-side identity hint the header uses, so the page stays static until
 * it runs.
 */
export default function BudgetView() {
  const me = useQuery({
    queryKey: queryKeys.me(),
    queryFn: (): Promise<{ sub: string | null; email: string | null }> =>
      fetch("/api/me").then((r) => (r.ok ? r.json() : { sub: null, email: null })),
    staleTime: 5 * 60_000,
  });

  if (me.isPending) return <BudgetLoading />;
  if (me.data?.sub) return <ServerBudgetContent meEmail={me.data.email ?? undefined} />;
  return <BudgetContent />;
}
