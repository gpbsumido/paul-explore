"use client";

import { useState } from "react";
import type { WorkFeature } from "../_data/types";

type Role = "Owner" | "Admin" | "Analyst" | "Viewer";
const ROLE_TINT: Record<Role, string> = {
  Owner: "#f472b6",
  Admin: "#60a5fa",
  Analyst: "#34d399",
  Viewer: "#94a3b8",
};

const USERS: { name: string; email: string; role: Role }[] = [
  { name: "Ana P.", email: "ana@studio.example", role: "Owner" },
  { name: "Devon R.", email: "devon@studio.example", role: "Admin" },
  { name: "Kim L.", email: "kim@studio.example", role: "Analyst" },
  { name: "Sam W.", email: "sam@studio.example", role: "Viewer" },
];

const API_KEY = "sk_live_9f2a_7c41_demo_only_not_real";

/**
 * Vignette: the platform console's admin suite. A users-and-roles table plus
 * an API key you can reveal and copy. Copy is faked with local state.
 */
export default function AdminSuiteDemo({ feature }: { feature: WorkFeature }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex h-full min-h-64 flex-col gap-3 p-4">
      <p className="text-[13px] font-semibold text-foreground">{feature.title}</p>

      <div className="rounded-lg border border-border p-3">
        <p className="mb-1 text-[11px] uppercase tracking-wider text-muted">
          Live API key
        </p>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded bg-black/5 px-2 py-1 font-mono text-[11px] text-foreground dark:bg-white/10">
            {revealed ? API_KEY : "•".repeat(28)}
          </code>
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="rounded-md border border-border px-2 py-1 text-[11px] text-foreground"
          >
            {revealed ? "Hide" : "Reveal"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            className="rounded-md border border-border px-2 py-1 text-[11px] text-foreground"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full text-left text-[12px]">
          <thead className="text-muted">
            <tr>
              <th className="pb-1 font-medium">Member</th>
              <th className="pb-1 font-medium">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {USERS.map((u) => (
              <tr key={u.email}>
                <td className="py-1.5">
                  <p className="text-foreground">{u.name}</p>
                  <p className="text-[10px] text-muted">{u.email}</p>
                </td>
                <td className="py-1.5">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: ROLE_TINT[u.role] }}
                  >
                    {u.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
