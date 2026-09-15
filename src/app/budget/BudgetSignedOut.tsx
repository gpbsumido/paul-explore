import Button from "@/components/ui/Button";

/** What a signed-out visitor is told the budget does, before they sign in. */
const FEATURES = [
  {
    title: "Log a spend in a few taps",
    body: "Tap Add, pick a category, type the amount — the date and time default to now, so the common case is a category and a number.",
  },
  {
    title: "Share it, and split expenses",
    body: "Add the people you split with, then divide any single expense across them with a one-tap even split. The by-person totals count each share.",
  },
  {
    title: "See where the money goes",
    body: "The last 30 days, the current billing cycle, and a breakdown by category and by person — plus a week, month, and year history that compares this period to the last.",
  },
];

/**
 * The budget behind a sign-in wall. A signed-out visitor gets this explanation
 * of what the tracker does and a way in — no budget data and no controls, since
 * a budget now lives on your account rather than in the browser.
 */
export default function BudgetSignedOut() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Budget</h1>
      <p className="mt-2 text-muted">
        A fast-add budget tracker: log a spend in a few taps, share a budget with the people you
        split with, and see where the money goes.
      </p>

      <ul className="mt-6 space-y-3">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="rounded-xl border border-border bg-surface/60 p-4">
            <h2 className="text-sm font-semibold text-foreground">{feature.title}</h2>
            <p className="mt-1 text-sm text-muted">{feature.body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-xl border border-border bg-surface/40 p-4">
        <p className="text-sm text-muted">
          Your budget is tied to your account and syncs across your devices. Sign in to get
          started.
        </p>
        <Button
          href={`/auth/login?returnTo=${encodeURIComponent("/budget")}`}
          className="mt-3"
        >
          Sign in
        </Button>
      </div>
    </div>
  );
}
