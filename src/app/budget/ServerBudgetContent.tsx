"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { toBudget } from "@/lib/budget/api";
import AddExpenseFlow from "./AddExpenseFlow";
import Analytics from "./Analytics";
import EditExpenseSheet from "./EditExpenseSheet";
import HistoryPanel from "./HistoryPanel";
import Sharing from "./Sharing";
import BudgetLoading from "./loading";
import { useServerBudget } from "./useServerBudget";

/**
 * The budget page for a signed-in visitor: the same building blocks the local
 * version renders, wired to the server through useServerBudget. Sharing here is
 * the real thing — a public budget and approved join requests — so there is no
 * localStorage invite link, unlike the anonymous view.
 */
export default function ServerBudgetContent({ meEmail }: { meEmail?: string }) {
  const b = useServerBudget();
  const [addingPerson, setAddingPerson] = useState(false);
  const [personName, setPersonName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  if (b.status === "pending") return <BudgetLoading />;
  if (b.status === "error" || !b.dto) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
          Couldn&apos;t load your budget. It syncs once the budgets service is
          reachable — your data is safe on the server.
        </p>
      </div>
    );
  }

  const budget = toBudget(b.dto, b.activePersonId);
  const editing = budget.expenses.find((e) => e.id === editingId) ?? null;
  const isOwner = b.dto.role === "owner";

  const savePerson = () => {
    if (!personName.trim()) return;
    b.addPersonNamed(personName.trim());
    setPersonName("");
    setAddingPerson(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 pt-6 pb-[max(2rem,calc(env(safe-area-inset-bottom)+1.5rem))] sm:px-6">
      <header>
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">
          {b.dto.name || "Budget"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Synced to your account{isOwner ? "" : " (shared with you)"}. Log a spend
          in a few taps and see where the money goes.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <AddExpenseFlow onAdd={b.add} />
      </div>

      <fieldset className="rounded-2xl border border-border bg-surface p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
          Active person
        </legend>
        <div className="flex flex-wrap items-center gap-3">
          {budget.people.map((p) => (
            <label key={p.id} className="inline-flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name="active-person"
                checked={p.id === budget.activePersonId}
                onChange={() => b.selectPerson(p.id)}
              />
              {p.name}
            </label>
          ))}
          {addingPerson ? (
            <span className="flex items-end gap-2">
              <Input
                label="New person name"
                hideLabel
                placeholder="Name"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
              />
              <Button size="sm" onClick={savePerson}>
                Save person
              </Button>
            </span>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setAddingPerson(true)}>
              + Add person
            </Button>
          )}
        </div>
      </fieldset>

      {budget.expenses.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Nothing logged yet. Tap &ldquo;Add expense&rdquo; to log your first spend.
        </p>
      ) : (
        <>
          <Analytics budget={budget} onEditExpense={setEditingId} />
          <HistoryPanel budget={budget} />
        </>
      )}

      {isOwner && (
        <Sharing
          visibility={budget.visibility}
          ownerEmail={budget.ownerEmail}
          joinRequests={budget.joinRequests}
          meEmail={meEmail}
          onSetVisibility={(v) => b.setVisible(v)}
          onRequestJoin={b.requestJoin}
          onApprove={b.approveRequest}
          onDeny={b.denyRequest}
        />
      )}

      {editing && (
        <EditExpenseSheet
          open
          expense={editing}
          people={budget.people}
          onSave={(patch) => {
            b.edit(editing.id, patch);
            setEditingId(null);
          }}
          onDelete={() => {
            b.remove(editing.id);
            setEditingId(null);
          }}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
