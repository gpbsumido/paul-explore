"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Sheet from "@/components/ui/Sheet";
import AddExpenseFlow from "./AddExpenseFlow";
import Analytics from "./Analytics";
import { useBudget } from "./useBudget";
import { buildInviteLink, decodeInvite, parseJoinToken } from "@/lib/budget/share";

/**
 * The budget page: the fast-add flow up top, who the budget is shared with, and
 * the analytics below. Everything is client-side over localStorage; the only
 * server-shaped piece is the invite link, which carries the budget so two people
 * can land on the same one before a real backend exists.
 */
export default function BudgetContent() {
  const { budget, add, addPersonNamed, selectPerson, join } = useBudget();
  const [addingPerson, setAddingPerson] = useState(false);
  const [personName, setPersonName] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinToken] = useState(() =>
    typeof window === "undefined" ? null : parseJoinToken(window.location.search),
  );
  const [joinName, setJoinName] = useState("");
  const [joined, setJoined] = useState(false);

  const invited = joinToken ? decodeInvite(joinToken) : null;
  const inviteLink =
    typeof window === "undefined" ? "" : buildInviteLink(budget, window.location.origin);

  const savePerson = () => {
    if (!personName.trim()) return;
    addPersonNamed(personName);
    setPersonName("");
    setAddingPerson(false);
  };

  const acceptInvite = () => {
    if (!joinToken) return;
    join(joinToken, joinName);
    setJoined(true);
    window.history.replaceState(null, "", "/budget");
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(inviteLink);
    setCopied(true);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Budget</h1>
        <p className="mt-1 text-sm text-muted">
          Log a spend in a few taps, share it with the people you split with, and
          see where the money goes.
        </p>
      </header>

      {invited && !joined && (
        <section
          aria-label="Invitation"
          className="rounded-2xl border border-[var(--color-feature-budget)] bg-surface p-4"
        >
          <p className="text-sm text-foreground">
            You have been invited to a shared budget with {invited.people.length}{" "}
            {invited.people.length === 1 ? "person" : "people"}. Join to add your
            spending to it.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <Input
              label="Your name"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
            />
            <Button onClick={acceptInvite}>Join budget</Button>
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <AddExpenseFlow onAdd={add} />
        <Button variant="outline" onClick={() => setInviteOpen(true)}>
          Invite to share
        </Button>
      </div>

      <fieldset className="rounded-2xl border border-border bg-surface p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
          Active person
        </legend>
        <div className="flex flex-wrap items-center gap-3">
          {budget.people.map((p) => (
            <label
              key={p.id}
              className="inline-flex items-center gap-2 text-sm text-foreground"
            >
              <input
                type="radio"
                name="active-person"
                checked={p.id === budget.activePersonId}
                onChange={() => selectPerson(p.id)}
              />
              {p.name}
            </label>
          ))}

          {addingPerson ? (
            <span className="flex items-end gap-2">
              <Input
                label="Name"
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
        <Analytics budget={budget} />
      )}

      <Sheet open={inviteOpen} onClose={() => setInviteOpen(false)} label="Invite to share">
        <h2 className="text-base font-semibold text-foreground">Invite to share</h2>
        <p className="mt-1 text-sm text-muted">
          Send this link. Opening it loads the budget into their browser and adds
          them as a person. Live sync across devices is the next step, once this
          moves to a backend.
        </p>
        <Input className="mt-3" label="Invite link" readOnly value={inviteLink} />
        <div className="mt-3">
          <Button onClick={copyLink}>{copied ? "Copied" : "Copy link"}</Button>
        </div>
      </Sheet>
    </div>
  );
}
