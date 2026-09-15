"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { Budget, JoinRequest } from "@/lib/budget/types";

const card = "rounded-2xl border border-border bg-surface p-4";
const heading = "text-xs font-semibold uppercase tracking-wide text-muted";

/**
 * Sharing controls. The owner can make the budget public and see who has asked
 * to join; anyone can ask to join a budget they know the owner's email for.
 *
 * Across accounts this needs a backend to route and store the request — for now
 * it lives in the same browser store the owner reads, and the copy says so. The
 * `email` on a request is the owner address it was aimed at; a real backend
 * would attach the requester's authenticated identity server-side.
 */
export default function Sharing({
  visibility,
  ownerEmail,
  joinRequests,
  meEmail,
  onSetVisibility,
  onRequestJoin,
  onApprove,
  onDeny,
}: {
  visibility: Budget["visibility"];
  ownerEmail?: string;
  joinRequests: JoinRequest[];
  meEmail?: string;
  onSetVisibility: (visibility: Budget["visibility"]) => void;
  onRequestJoin: (input: { name: string; email: string }) => void;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}) {
  const [targetEmail, setTargetEmail] = useState("");
  const [name, setName] = useState("");
  const shownEmail = ownerEmail ?? meEmail;

  const submit = () => {
    if (!targetEmail.trim() || !name.trim()) return;
    onRequestJoin({ name: name.trim(), email: targetEmail.trim() });
    setTargetEmail("");
    setName("");
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <section aria-label="Sharing" className={card}>
        <p className={heading}>Sharing</p>
        <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={visibility === "public"}
            onChange={(e) => onSetVisibility(e.target.checked ? "public" : "private")}
          />
          Make this budget public
        </label>

        {visibility === "public" && (
          <p className="mt-2 text-sm text-muted">
            Others can ask to join using{" "}
            <span className="font-medium text-foreground">
              {shownEmail ?? "your account email"}
            </span>
            . Requests show up below.
          </p>
        )}

        {joinRequests.length > 0 && (
          <ul aria-label="Join requests" className="mt-3 space-y-2">
            {joinRequests.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-border p-2"
              >
                <span className="text-sm text-foreground">
                  {r.name}
                  <span className="ml-1 text-xs text-muted">{r.email}</span>
                </span>
                <span className="flex gap-1">
                  <Button size="xs" onClick={() => onApprove(r.id)}>
                    Approve
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => onDeny(r.id)}>
                    Deny
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Ask to join" className={card}>
        <p className={heading}>Ask to join a budget</p>
        <p className="mt-2 text-sm text-muted">
          Know someone&apos;s email? Ask to join the budget they made public.
        </p>
        <div className="mt-3 space-y-2">
          <Input
            label="Budget owner's email"
            type="email"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
          />
          <Input label="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={submit}>Ask to join</Button>
        </div>
        <p className="mt-2 text-xs text-muted">
          Requests reach the owner once budgets sync through a backend; today this
          records the ask on this device.
        </p>
      </section>
    </div>
  );
}
