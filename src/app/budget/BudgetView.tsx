"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import BudgetSignedOut from "./BudgetSignedOut";
import ServerBudgetContent from "./ServerBudgetContent";
import BudgetLoading from "./loading";

/**
 * Gates the budget on sign-in. A budget lives on your account now, so a
 * signed-in visitor gets the server-backed tracker and a signed-out one gets an
 * explanation of what it does and a way in — never the tracker itself. The
 * choice hangs on /api/me, the same client-side identity hint the header uses,
 * so the page stays static until it runs.
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
  return <BudgetSignedOut />;
}
