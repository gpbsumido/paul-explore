"use client";

import BudgetSignedOut from "./BudgetSignedOut";
import ServerBudgetContent from "./ServerBudgetContent";
import BudgetLoading from "./loading";
import { useMe } from "@/hooks/useMe";

/**
 * Gates the budget on sign-in. A budget lives on your account now, so a
 * signed-in visitor gets the server-backed tracker and a signed-out one gets an
 * explanation of what it does and a way in — never the tracker itself. The
 * choice hangs on /api/me, the same client-side identity hint the header uses,
 * so the page stays static until it runs.
 */
export default function BudgetView() {
  const me = useMe();

  if (me.isPending) return <BudgetLoading />;
  if (me.isError) {
    return (
      <p
        role="alert"
        className="mx-auto max-w-xl px-4 py-12 text-center text-sm text-error-600 dark:text-error-400"
      >
        Couldn&apos;t check whether you&apos;re signed in. Refresh to try again.
      </p>
    );
  }
  if (me.data?.sub) return <ServerBudgetContent meEmail={me.data.email ?? undefined} />;
  return <BudgetSignedOut />;
}
